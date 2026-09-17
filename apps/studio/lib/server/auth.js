import { withAuth } from "../../../../utils/server/withAuth";
import { projectResponse } from "./projectRecords";
import {
  requestContext,
  runWithRequest,
} from "../../../../utils/server/requestContext";

export const withStudioAuth = (handler) =>
  withAuth((req, res) =>
    runWithRequest({ ...requestContext(), namespace: "studio" }, async () => {
      const json = res.json.bind(res);
      res.json = async (value) => json(await projectResponse(value));
      try {
        return await handler(req, res);
      } catch (error) {
        const status = error.status || 400;
        if (status >= 500) console.error("[studio]", error.code || error.name);
        if (!res.headersSent)
          return res.status(status).json({
            error:
              status >= 500
                ? "The production store is temporarily unavailable. Your last saved work is safe."
                : error.message,
          });
        return undefined;
      }
    }),
  );
