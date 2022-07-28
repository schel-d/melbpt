import express from "express";

export async function main() {
  console.log("Starting...");

  const app = express();
  const port = process.env.PORT ?? 3000;

  app.set("views", "./client/pug");
  app.set("view engine", "pug");
  app.use(express.static(".out/public"));

  app.get("/", (req, res: express.Response) => {
    res.render("index");
  });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
  });
}
