/**@type {import("../types/type").Data} */
const data = JSON.parse(test_data_raw);

window.addEventListener("DOMContentLoaded", async function () {
  this.document.getElementById("problem-container").innerHTML = "<ol>" + 
    data.problems.map((problem, problem_id) => 
      `<li id="problem-${problem_id}-container">
        <div class="question-container">${problem.raw}</div>
        <div class="answer-container">${
          (() => {
            const answers = problem.ans.map((ans, ans_id) => {
              const id = `problem-${problem_id}-ans-${ans_id}`;
              return `<div class="answer"><input type="${problem.type === "multi" ? "checkbox" : "radio"}" id="${id}" name="ans-for-problem-${problem_id}" value="${id}"><label for=${id}>${ans.raw}</label></div>`;
            });
            if (!problem.dont_shuffle) {
              answers.sort(() => Math.random() - 0.5);
            }
            return answers.join("\n")
          })()
        }</div>
        <div class="note-container">
          ${problem.note ?? ""}
        </div>
      </li>`
    )
      .join("\n") + 
    "</ol>";

  console.log(data);
});


/** @typedef {{ [K in keyof import("../types/type").GroupNames]: number }} Score*/
/**
 * 
 * @param { Score } score 
 * @param { Score } score_max 
 * @param { Record<string, Record<number, number>> } score_of_problem 
 */
function genResult(score, score_max, score_of_problem) {
  $("body").addClass("show-note");

  let html = 
    `<div class="result-group">
      <h3>总分</h3>
      <p>${
        Math.round(
          Object.keys(data.groups).map(
            groupName => score[groupName] / score_max[groupName] * (data.groups[groupName].weight ?? 1)
          ).reduce((a, b) => a+b, 0)
          / Object.keys(data.groups).map(
            groupName => data.groups[groupName].weight ?? 1
          ).reduce((a, b) => a+b, 0) * 100
        )
      }</p>
    </div>`;
  
  html +=
    Object.keys(data.groups).map(groupName => {
      return `<div class="result-group">
        <h3>${data.groups[groupName].name}</h3>
        <div class="description">${data.groups[groupName].description}</div>
        <p>得分：${score[groupName]}（满分${score_max[groupName]}） ${Math.round(score[groupName]/score_max[groupName] * 100)}% </p>
        <details>
          <summary>详细信息</summary>
          <p>得分情况：</p>
          <table>
            <thead>
              <th>题号</th>
              <th>得分</th>
            </thead>
            <tbody>
            ${
              Object.keys(score_of_problem[groupName]).map(pid => `
                <tr>
                  <td><a href="#problem-${pid}-container">${Number(pid) + 1}</a></td>
                  <td>${score_of_problem[groupName][pid]}</td>
                </tr>`
              ).join("")
            }
            </tbody>
          </table>
        </details>
      </div>`;
    }).join("")

    document.getElementById("result-container").innerHTML = html;
}

function submit() {
  /** @type {Score} */
  const score = {}
  /** @type {Score} */
  const score_max = {}
  /** @type {Record<string, Record<number, number>>} */
  const score_of_problem = {};
  // Initialize
  Object.keys(data.groups).forEach(groupName => {
    score[groupName] ??= 0;
    score_max[groupName] ??= 0;
    score_of_problem[groupName] ??= {};
  })
  data.problems.forEach((problem, problem_id) => {
    Object.keys(problem.group).forEach(g => {
      score_of_problem[g][problem_id] ??= 0;
    });

    if (problem.type == "multi") {
      problem.ans.forEach(ans => {
        Object.keys(problem.group).forEach(g => {
          if (ans.score > 0) {
            score_max[g] += (ans.score ?? 0) * (problem.group[g] ?? 1);
          }
        });
      });
    } else {
      // let maxinium = 0;
      // problem.ans.forEach(ans => {
      //   if (ans.score > maxinium) maxinium = ans.score;
      // });
      // Object.keys(problem.group).forEach(g => {
      //   score_max[g] += maxinium * (problem.group[g] ?? 1);
      // });
      
      // 本来打算最大值即满分，但是看上去有的选项可以超过满分的样子？
      Object.keys(problem.group).forEach(g => {
        score_max[g] += 1 * (problem.group[g] ?? 1);
      });
    }

    problem.ans.forEach((ans, ans_id) => {
      const id = `problem-${problem_id}-ans-${ans_id}`;
      Object.keys(problem.group).forEach(g => {
        if (document.getElementById(id).checked) {
          score[g] += (ans.score ?? 0) * (problem.group[g] ?? 1);
          score_of_problem[g][problem_id] += (ans.score ?? 0) * (problem.group[g] ?? 1);
        }
      });
    });
  });
  console.log(score);
  console.log(score_max);
  console.log(score_of_problem);
  genResult(score, score_max, score_of_problem);

  window.scrollTo(0, 999999999);
}