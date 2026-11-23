import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";

const app = new Koa();
const router = new Router();

const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

app.use(async (ctx, next) => {
  if (ctx.path.startsWith("/api/")) {
    await new Promise((resolve) => {
      setTimeout(resolve, 2500);
    });
  }

  await next();
});

router.get("/", (ctx) => {
  ctx.body = "Loading Styling API is running";
});

router.get("/api/status", (ctx) => {
  ctx.body = {
    status: "ok",
    message: "Данные успешно загружены",
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server is listening on port ${PORT}`);
});
