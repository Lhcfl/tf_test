/**@type {import("../types/type").Data} */
const data = JSON.parse(test_data_raw);
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-|"

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
  const para = new URLSearchParams(this.window.location.search);
  if (para.get("a")) {
    para.get("a")?.split("|")?.forEach(str => {
      if (str) {
        const [problem_id, answerStr] = str.split(":");
        const answer = answerStr.split(",");
        answer.forEach(ans_id => {
          $(`#problem-${problem_id}-ans-${ans_id}`).click();
        })
      }
    });
    submit();
  }
  if (para.get("b")) {
    parse64(para.get("b")).split("7").forEach((str, problem_id) => {
      if (str) {
        const answer = str.split("6");
        answer.forEach(ans_id => {
          $(`#problem-${problem_id}-ans-${ans_id}`).click();
        })
      }
    });
    submit();
  }
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
  
  let paraStr = "";
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
      if (document.getElementById(id).checked) {
        paraStr += Number(ans_id).toString(6) + "6";
        Object.keys(problem.group).forEach(g => {
          score[g] += (ans.score ?? 0) * (problem.group[g] ?? 1);
          score_of_problem[g][problem_id] += (ans.score ?? 0) * (problem.group[g] ?? 1);
        });
      }
    });
    paraStr += "7";
  });

  console.log(score);
  console.log(score_max);
  console.log(score_of_problem);
  genResult(score, score_max, score_of_problem);

  history.pushState(null, null, window.location.href.split("?")[0] + "?b=" + parse8(paraStr));
  
  window.scrollTo(0, 999999999);
}

/**
 * 
 * @param {string} str 
 */
function parse8(str) {
  let res = "";
  if (str.length % 2 == 1) {
    str += "7";
  }
  for (let i = 0; i < str.length; i += 2) {
    res += B64[parseInt(str.slice(i, i+2), 8)];
  }
  return res;
}
/**
 * 
 * @param {string} str 
 */
function parse64(str) {
  res = ""
  for (const c of str) {
    res += B64.indexOf(c).toString(8); 
  }
  return res;
}

function share() {
  if (navigator.canShare) {
    navigator.share({
      url: window.location.href
    })
  } else {
    alert("浏览器不支持分享喵，请手动复制现在的url")
  }
}