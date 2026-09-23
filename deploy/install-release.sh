#!/usr/bin/env bash
set -euo pipefail
[[ $# == 2 && $1 =~ ^[0-9]+$ && $2 =~ ^[a-f0-9]{40}-[0-9]+$ ]] || exit 2
exec 9>/run/lock/team-c-deploy.lock
flock -n 9
archive="/opt/team-c/incoming/$1/release.tar.gz"
release="/opt/team-c/releases/$2"
[[ -f "$archive" && ! -e "$release" ]] || exit 2
install -d -o team-c -g team-c -m 0755 "$release"
runuser -u team-c -- tar --no-same-owner -xzf "$archive" -C "$release"
previous=$(readlink -f /opt/team-c/current || true)
was_active=false
systemctl is-active --quiet team-c && was_active=true
rollback() {
    status=$?
    trap - ERR
    if [[ -n "$previous" && -d "$previous" ]]; then
        ln -sfn "$previous" /opt/team-c/current
        if $was_active; then systemctl restart team-c; fi
    else
        systemctl stop team-c || true
    fi
    echo 'Deployment failed; previous application restored when available. Database backup retained.' >&2
    exit "$status"
}
trap rollback ERR
systemctl stop team-c || true
install -d -m 0700 /var/backups/team-c
backup="/var/backups/team-c/$(date -u +%Y%m%dT%H%M%SZ)-$1.dump"
runuser -u postgres -- pg_dump -Fc team_c_dev > "$backup"
chmod 0600 "$backup"
runuser -u team-c -- bash -c '
    set -euo pipefail
    set -a
    source /etc/team-c/app.env
    set +a
    export PATH=/opt/node/bin:/usr/local/bin:/usr/bin:/bin
    cd "$1"
    node node_modules/drizzle-kit/bin.cjs migrate
    if [[ ! -f /opt/team-c/seeded ]]; then
        node --import tsx src/db/seed.ts
    fi
' bash "$release"
touch /opt/team-c/seeded
ln -sfn "$release" /opt/team-c/current
systemctl start team-c
healthy=false
for attempt in $(seq 1 30); do
    if curl -fsSL --max-time 3 http://127.0.0.1:3000/stores > /dev/null && curl -fsSL --max-time 3 http://127.0.0.1:3000/stores/40000000-0000-4000-8000-000000000001 > /dev/null; then
        healthy=true
        break
    fi
    sleep 2
done
$healthy
install -m 0644 "$release/release.json" /opt/team-c/release.json
trap - ERR
# Retain the active release and its predecessor for rollback.
for old in /opt/team-c/releases/*; do
    [[ "$old" == "$release" || "$old" == "$previous" ]] || rm -rf -- "$old"
done
find /var/backups/team-c -name '*.dump' -mtime +14 -delete
echo "Deployed $2"
