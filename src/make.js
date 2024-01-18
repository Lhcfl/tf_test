import fs from 'fs';
import markdownit from 'markdown-it';
import yaml from 'js-yaml';
import UglifyJS from 'uglify-js'
import stylus from 'stylus';

const md = markdownit({
  html: true,
});

/**@type {string} */
let template = String(fs.readFileSync("templates/index.html"));

/**@type {import('./types/type').Data} */
const data = yaml.load(String(fs.readFileSync("data/data.yml")));

Object.keys(data.groups).forEach(key => {
  data.groups[key].name = md.render(data.groups[key].name);
  data.groups[key].description = md.render(data.groups[key].description);
});
data.problems.forEach(problem => {
  problem.raw = md.render(problem.raw);
  problem.ans.forEach(ans => {
    ans.raw = md.render(ans.raw);
  });
  if (problem.note) {
    problem.note = md.render(problem.note);
  }
});

template = template.replace("<!--DATA-->", `<script>const test_data_raw=\`${JSON.stringify(data).replaceAll("\\", "\\\\")}\`</script>`);
template = template.replace("<!--STYLE-->", `<style>${stylus.render(fs.readFileSync("styles/style.styl").toString())}</style>`);
template = template.replace("<!--JQUERY.JS-->", `<script>${fs.readFileSync("scripts/jquery.min.js").toString()}</script>`);
template = template.replace("<!--INDEX.JS-->", `<script>${UglifyJS.minify(fs.readFileSync("scripts/index.js").toString()).code}</script>`);

fs.writeFileSync("../index.html", template);

console.log(new Date, " build succeed.")
