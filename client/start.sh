# @reboot . /watcher/client/run_watcher.sh

deno run --allow-read --allow-net --allow-write main.ts \
  --url="http://localhost:8080" \
  --inPath="/watcher/tests/remote_desk" \
  --outPath="/watcher/tests/linux_big_pc"
