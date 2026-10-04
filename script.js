const DAYS = ["日","月","火","水","木","金","土"];
const STORAGE_WAGES = "salaryAppWagesV1";
const STORAGE_HISTORY = "salaryAppHistoryV1";

const defaultWages = {
  weekday: { normal: 1200, night: 1500 },
  saturday: { normal: 1300, night: 1600 },
  sundayHoliday: { normal: 1400, night: 1700 }
};

const holidays = {
  // 2026
  "2026-01-01":"元日","2026-01-12":"成人の日","2026-02-11":"建国記念の日",
  "2026-02-23":"天皇誕生日","2026-03-20":"春分の日","2026-04-29":"昭和の日",
  "2026-05-03":"憲法記念日","2026-05-04":"みどりの日","2026-05-05":"こどもの日","2026-05-06":"振替休日",
  "2026-07-20":"海の日","2026-08-11":"山の日","2026-09-21":"敬老の日","2026-09-22":"休日","2026-09-23":"秋分の日",
  "2026-10-12":"スポーツの日","2026-11-03":"文化の日","2026-11-23":"勤労感謝の日",
  // 2027
  "2027-01-01":"元日","2027-01-11":"成人の日","2027-02-11":"建国記念の日",
  "2027-02-23":"天皇誕生日","2027-03-21":"春分の日","2027-03-22":"振替休日","2027-04-29":"昭和の日",
  "2027-05-03":"憲法記念日","2027-05-04":"みどりの日","2027-05-05":"こどもの日",
  "2027-07-19":"海の日","2027-08-11":"山の日","2027-09-20":"敬老の日","2027-09-23":"秋分の日",
  "2027-10-11":"スポーツの日","2027-11-03":"文化の日","2027-11-23":"勤労感謝の日",
  // 2028
  "2028-01-01":"元日","2028-01-10":"成人の日","2028-02-11":"建国記念の日",
  "2028-02-23":"天皇誕生日","2028-03-20":"春分の日","2028-04-29":"昭和の日",
  "2028-05-03":"憲法記念日","2028-05-04":"みどりの日","2028-05-05":"こどもの日",
  "2028-07-17":"海の日","2028-08-11":"山の日","2028-09-18":"敬老の日","2028-09-22":"秋分の日",
  "2028-10-09":"スポーツの日","2028-11-03":"文化の日","2028-11-23":"勤労感謝の日",
  // 2029
  "2029-01-01":"元日","2029-01-08":"成人の日","2029-02-11":"建国記念の日","2029-02-12":"振替休日",
  "2029-02-23":"天皇誕生日","2029-03-20":"春分の日","2029-04-29":"昭和の日",
  "2029-04-30":"休日","2029-05-03":"憲法記念日","2029-05-04":"みどりの日","2029-05-05":"こどもの日","2029-05-06":"振替休日",
  "2029-07-16":"海の日","2029-08-11":"山の日","2029-08-12":"振替休日","2029-09-17":"敬老の日","2029-09-23":"秋分の日","2029-09-24":"振替休日",
  "2029-10-08":"スポーツの日","2029-11-03":"文化の日","2029-11-23":"勤労感謝の日",
  // 2030
  "2030-01-01":"元日","2030-01-14":"成人の日","2030-02-11":"建国記念の日",
  "2030-02-23":"天皇誕生日","2030-03-20":"春分の日","2030-04-29":"昭和の日",
  "2030-05-03":"憲法記念日","2030-05-04":"みどりの日","2030-05-05":"こどもの日","2030-05-06":"振替休日",
  "2030-07-15":"海の日","2030-08-11":"山の日","2030-08-12":"振替休日","2030-09-16":"敬老の日","2030-09-23":"秋分の日",
  "2030-10-14":"スポーツの日","2030-11-03":"文化の日","2030-11-04":"振替休日","2030-11-23":"勤労感謝の日"
};

function pad(n){return String(n).padStart(2,"0")}
function formatDate(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function parseDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function isLeap(y){return y%4===0 && (y%100!==0 || y%400===0)}
function minutes(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function money(n){return Math.round(n).toLocaleString("ja-JP")+"円"}

function dateInfo(s){
  const d=parseDate(s), day=d.getDay(), holiday=holidays[s];
  let category = holiday || day===0 ? "sundayHoliday" : day===6 ? "saturday" : "weekday";
  return {d,day,holiday,category};
}

function loadWages(){
  try{return {...defaultWages,...JSON.parse(localStorage.getItem(STORAGE_WAGES)||"{}")}}
  catch{return structuredClone(defaultWages)}
}
function saveWages(){localStorage.setItem(STORAGE_WAGES,JSON.stringify(wages))}

let wages=loadWages();

function renderWageSettings(){
  const labels=[
    ["weekday","平日（月〜金）"],["saturday","土曜日"],["sundayHoliday","日曜・祝日"]
  ];
  wageSettings.innerHTML = labels.map(([key,label])=>`
    <div class="wage-row">
      <div class="title">${label}</div>
      <label>通常時給<input type="number" min="0" step="10" data-key="${key}" data-band="normal" value="${wages[key].normal}"></label>
      <label>夜間時給<input type="number" min="0" step="10" data-key="${key}" data-band="night" value="${wages[key].night}"></label>
    </div>`).join("");
}

function updateDayInfo(){
  const s=workDate.value;
  if(!s){dayInfo.textContent="勤務日を選択してください。";return}
  const info=dateInfo(s);
  const label=info.holiday ? `祝日：${info.holiday}` : info.day===0 ? "日曜日" : info.day===6 ? "土曜日" : "平日";
  dayInfo.textContent=`${s}（${DAYS[info.day]}） / ${label}`;
}

function calculate(){
  const s=workDate.value, start=startTime.value, end=endTime.value;
  if(!s || !start || !end){result.textContent="勤務日・出勤・退勤を入力してください。";return}
  const sm=minutes(start), em=minutes(end);
  if(em<=sm){result.textContent="退勤は出勤より後の時刻にしてください。";return}
  const info=dateInfo(s), total=em-sm;
  // 22:00〜翌5:00を夜間として扱う。日付をまたぐ勤務は退勤を翌日扱い。
  const nightStart=22*60, nightEnd=24*60;
  let normalMin=0, nightMin=0;
  if(sm < nightStart) normalMin=Math.min(em,nightStart)-sm;
  if(em > nightStart) nightMin=em-nightStart;
  // 00:00〜05:00を含む日またぎ勤務への対応
  if(em > 24*60){
    const afterMidnight=em-24*60;
    if(afterMidnight<=5*60) nightMin+=afterMidnight;
  }
  if(nightMin<0) nightMin=0;
  if(normalMin<0) normalMin=0;
  // 通常帯を「合計−夜間」にして、日をまたがない通常勤務にも対応
  if(em<=24*60) normalMin=total-nightMin;
  const w=wages[info.category];
  const amount=normalMin/60*w.normal+nightMin/60*w.night;
  const text=`${s}（${DAYS[info.day]}）${info.holiday?`・${info.holiday}`:""}：${start}〜${end} / ${Math.floor(total/60)}時間${total%60}分 → ${money(amount)}`;
  result.textContent=money(amount);
  const history=JSON.parse(localStorage.getItem(STORAGE_HISTORY)||"[]");
  history.unshift({date:s,start,end,amount,category:info.category,holiday:info.holiday||""});
  localStorage.setItem(STORAGE_HISTORY,JSON.stringify(history.slice(0,100)));
  renderHistory();
}

function renderHistory(){
  const history=JSON.parse(localStorage.getItem(STORAGE_HISTORY)||"[]");
  if(!history.length){document.getElementById("history").innerHTML='<p class="muted">まだ計算履歴はありません。</p>';return}
  document.getElementById("history").innerHTML=history.map((x,i)=>`
    <div class="history-item">
      <strong>${x.date}（${DAYS[parseDate(x.date).getDay()]}） ${money(x.amount)}</strong>
      <div>${x.start}〜${x.end}${x.holiday?` ・ ${x.holiday}`:""}</div>
      <div class="small">${x.category==="weekday"?"平日":x.category==="saturday"?"土曜日":"日曜・祝日"}</div>
    </div>`).join("");
}

document.getElementById("workDate").addEventListener("change",updateDayInfo);
document.getElementById("calcBtn").addEventListener("click",calculate);
document.getElementById("todayBtn").addEventListener("click",()=>{
  const now=new Date();
  workDate.value=formatDate(now);
  updateDayInfo();
});
document.getElementById("saveWages").addEventListener("click",()=>{
  document.querySelectorAll("#wageSettings input").forEach(input=>{
    wages[input.dataset.key][input.dataset.band]=Number(input.value)||0;
  });
  saveWages();
  alert("給料設定を保存しました。");
});
document.getElementById("resetWages").addEventListener("click",()=>{
  wages=structuredClone(defaultWages);saveWages();renderWageSettings();
});
document.getElementById("clearHistory").addEventListener("click",()=>{
  if(confirm("計算履歴をすべて削除しますか？")){localStorage.removeItem(STORAGE_HISTORY);renderHistory();}
});

const now=new Date();
workDate.value = now>=parseDate("2026-01-01") && now<=parseDate("2030-12-31") ? formatDate(now) : "2026-01-01";
renderWageSettings();updateDayInfo();renderHistory();
