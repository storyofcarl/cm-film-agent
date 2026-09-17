// Adapt existing, authenticated-server-only Film Agent handlers without opening
// their generation endpoints on Studio. Only approved job execution calls these.
export async function invokeHandler(
  handler,
  body,
  { method = "POST", query = {} } = {},
) {
  let status = 200;
  let result;
  const response = {
    setHeader() {},
    getHeader() {
      return undefined;
    },
    status(value) {
      status = value;
      return response;
    },
    json(value) {
      result = value;
      return response;
    },
    end(value) {
      result = value;
      return response;
    },
  };
  await handler({ method, body, query, headers: {} }, response);
  if (status >= 400)
    throw Object.assign(
      new Error(
        result?.error || "The provider could not complete this request.",
      ),
      { providerStatus: status, providerJobId: result?.jobId },
    );
  return result;
}
