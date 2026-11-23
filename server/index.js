import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";

const app = new Koa();
const router = new Router();

const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

app.use(async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 2500);
  });

  await next();
});

// API
router.get("/api/status", (ctx) => {
  ctx.body = {
    status: "ok",
    message: "Данные успешно загружены",
  };
});

router.get("/", (ctx) => {
  ctx.body = "Loading Styling API is running";
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`API server is listening on port ${PORT}`);
});
