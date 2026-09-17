// Only call with disposable account IDs created by the calling smoke test.
module.exports = async function removeStudioTestRecords(admin, owner) {
  if (!/^[a-f0-9-]{36}$/.test(owner))
    throw new Error("Invalid disposable account ID.");
  async function files(prefix) {
    const result = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage
        .from("studio-records")
        .list(prefix, { limit: 1000, offset });
      if (error) throw error;
      for (const entry of data) {
        const path = `${prefix}/${entry.name}`;
        if (!path.startsWith(owner + "/"))
          throw new Error("Unexpected test record path.");
        if (entry.id) result.push(path);
        else result.push(...(await files(path)));
      }
      if (data.length < 1000) return result;
    }
  }
  const paths = await files(owner);
  for (let start = 0; start < paths.length; start += 100) {
    const { error } = await admin.storage
      .from("studio-records")
      .remove(paths.slice(start, start + 100));
    if (error) throw error;
  }
};
