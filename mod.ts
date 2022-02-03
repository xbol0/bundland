import { OSSBucket } from "https://crux.land/3SKXQZ";
import { serveCallback } from "https://crux.land/serve_callback@beta";
import { assert } from "https://deno.land/std@0.122.0/testing/asserts.ts";
import { readableStreamFromReader } from "https://deno.land/std@0.122.0/streams/conversion.ts";

export function main() {
  // OSS config
  const accessKeyId = Deno.env.get("ACCESS_KEY_ID") || "";
  const accessKeySecret = Deno.env.get("ACCESS_KEY_SECRET") || "";
  const bucket = Deno.env.get("BUCKET_NAME") || "";
  const endpoint = Deno.env.get("OSS_ENDPOINT") || "";
  const oss = new OSSBucket({ accessKeyId, accessKeySecret, bucket, endpoint });

  // Port & token
  const port = Deno.env.get("FC_SERVER_PORT") || Deno.env.get("PORT") || "9000";
  const token = Deno.env.get("TOKEN") || "";

  serveCallback(+port, handler);
  console.log(`[${new Date().toUTCString()}] Port = ${port}`);

  async function handler(req: Request) {
    try {
      if (token) {
        const auth = req.headers.get("authorization");
        assert(auth, "Forbidden");
        const [_, t] = auth.split(" ");
        assert(t === token, "Forbidden");
      }
    } catch (e) {
      return new Response(e.message, { status: 401 });
    }

    // Replace default domain's base path.
    const uri = new URL(req.url);
    const prefix = req.headers.get("x-fc-base-path") || "";
    const pathname = uri.pathname.replace(prefix, "");

    // Publish a product
    if (req.method === "POST" || req.method === "PUT") {
      if (!pathname.match(/^\/\w+\@\w+$/)) {
        return new Response("Invalid path", { status: 400 });
      }
      if (!req.body) {
        return new Response("Empty body", { status: 400 });
      }

      const [name, tag] = pathname.slice(1).split("@");
      const sourcePath = name + "/" + tag + ".js";
      await oss.putObject(sourcePath, req.body);
      return new Response(null, { status: 204 });
    }

    // Get a product
    if (req.method === "GET") {
      let sourcePath = "";
      if (pathname.match(/^\/\w+\@\w+$/)) {
        const [name, tag] = pathname.slice(1).split("@");
        sourcePath = name + "/" + tag + ".js";
      } else {
        return new Response(null, {
          status: 307,
          headers: { location: uri.href + "@main" },
        });
      }
      if (!sourcePath) {
        return new Response("Invalid path", { status: 400 });
      }

      try {
        const body = await oss.getObjectReader(sourcePath);
        return new Response(readableStreamFromReader(body), {
          headers: {
            "content-type": "application/javascript",
          },
        });
      } catch (e) {
        return new Response(e.message, { status: 404 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}

main();
