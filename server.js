const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const app = express();
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, "views/assets")));

const port = 3000;

const tags = ["generator", "aura", "skill check", "hook", "heal","chest","injured","exhausted","haste"]

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "data", "generated.json");
  fs.readFile(filePath, "utf8", (err,data) => {
    if (err) {
      return res.status(500).json({error: "Failed to read file"})
    }
    try {
      data = JSON.parse(data)
      res.render('home', {
        data: data,
        tags: tags
      })
    } catch (err) {
      console.log(err)
      return res.status(500).json({error: "Failed to render"})
    }
  })
});

app.get("/generate", async (req, res) => {
  const filePath = path.join(__dirname, "data", "perks.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "File not found or unable to read file" });
    }
    try {
      const rawData = JSON.parse(data);
      const perkData = rawData.perks;
      const imageData = rawData.images;
      var notFound = 0;
      perkData.forEach((perk) => {
        let change = false;
        var find = perk.img
          .substring(perk.img.indexOf("/") + 1)
          .replace(/[^a-zA-Z-]/g, "")
          .toLowerCase();
        imageData.forEach((img) => {
          if (find == "coupdegrace") {
            perk.img =
              "";
            change = true;
          } else if (
            find ==
            img
              .substring(img.indexOf("IconPerks_") + 10, img.indexOf(".png"))
              .toLowerCase()
          ) {
            perk.img = img;
            change = true;
          }
        });
        if (!change) {
          console.log(find);
          notFound++;
          perk.img =
            "https://cdn.glitch.global/3ff7f89e-c0d6-4346-976f-7ae445c76682/IconHelp_perks.png?v=1723757760974";
        }
        delete perk.url;
        delete perk.id;
        delete perk.tier;
        perk.tags = [];
        if (perk.character == "") {
          perk.character = "General "+perk.role
        }
        const $ = cheerio.load(perk.description);
        perk.flavorText = $('.FlavorText').text()
        $('.FlavorText').remove()
        perk.description = $.text();
        tags.forEach((tag) => {
          if (perk.description.toLowerCase().replace(/\s/g, "").indexOf(tag.toLowerCase().replace(/\s/g, "")) > -1) {
            perk.tags.push(tag);
          }
        });
      });
      res.type("application/json").json(perkData);
    } catch (parseErr) {
      console.log(parseErr);
      res.status(500).json({ error: "Failed to parse JSON" });
    }
  });
});
app.listen(port, () => {
  console.log(`Server online on ${port}!`);
});
