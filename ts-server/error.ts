import express from "express";

export function respondWithError(res: express.Response, type: "404" | "500" | "offline") {
  const response = {
    "404": () => res.status(404).render("server-error", {
      title: "Page not found",
      shortTitle: "Not found",
      description: "This page doesn't exist, at least not anymore!",
      showLinks: true,
      image: "404"
    }),
    "500": () => res.status(500).render("server-error", {
      title: "Internal server error",
      shortTitle: "Error",
      description: "Looks like I've got a bug to fix...",
      showLinks: false,
      image: "500"
    }),
    "offline": () => res.render("server-error", {
      title: "You're offline",
      shortTitle: "Offline",
      description: "You'll have to reconnect to the internet to use TrainQuery",
      showLinks: false,
      image: "offline"
    })
  };

  response[type]();
}
