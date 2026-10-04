// 2026年〜2030年の祝日データ（振替休日・国民の休日を含む）
const HOLIDAYS = [
  // 2026年
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20", "2026-04-29",
  "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-07-20", "2026-08-11",
  "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-12", "2026-11-03", "2026-11-23",
  // 2027年
  "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21", "2027-03-22",
  "2027-04-29", "2027-05-03", "2027-05-04", "2027-05-05", "2027-07-19", "2027-08-11",
  "2027-09-20", "2027-09-23", "2027-10-11", "2027-11-03", "2027-11-23",
  // 2028年 (うるう年)
  "2028-01-01", "2028-01-10", "2028-02-11", "2028-02-23", "2028-03-20", "2028-04-29",
  "2028-05-03", "2028-05-04", "2028-05-05", "2028-07-17", "2028-08-11", "2028-09-18",
  "2028-09-22", "2028-10-09", "2028-11-03", "2028-11-23",
  // 2029年
  "2029-01-01", "2029-01-08", "2029-02-11", "2029-02-12", "2029-02-23", "2029-03-20",
  "2029-04-29", "2029-04-30", "2029-05-03", "2029-05-04", "2029-05-05", "2029-07-16",
  "2029-08-11", "2029-09-17", "2029-09-23", "2029-09-24", "2029-10-08", "2029-11-03", "2029-11-23",
  // 2030年
  "2030-01-01", "2030-01-14", "2030-02-11", "2030-02-23", "2030-03-20", "2030-04-29",
  "2030-05-03", "2030-05-04", "2030-05-05", "2030-05-06", "2030-07-15", "2030-08-11",
  "2030-08-12", "2030-09-16", "2030-09-23", "2030-10-14", "2030-11-03", "2030-11-04", "2030-11-23"
];

// 初期化処理
document.addEventListener("DOMContentLoaded", () => {
  // 本日の日付をセット
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("workDate").value = today;

  // イベントリスナー設定
  document.getElementById("baseWage").addEventListener("input", updateWageRates);
  document.getElementById("calcBtn").addEventListener("click", calculateSalary);
  document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);

  // 履歴のロード
  loadHistory();
});

// 基本時給変更に伴う各時給の自動計算
function updateWageRates() {
  const base = parseFloat(document.getElementById("baseWage").value) || 0;
  
  document.getElementById("wageWeekdayDay").value = base;
  document.getElementById("wageWeekdayNight").value = Math.round(base * 1.1);
  document.getElementById("wageSatDay").value = Math.round(base * 1.1);
  document.getElementById("wageSatNight").value = Math.round(base * 1.2);
  document.getElementById("wageSunHoliDay").value = Math.round(base * 1.2);
  document.getElementById("wageSunHoliNight").value = Math.round(base * 1.3);
}

// 区分判定 (平日 / 土曜 / 日曜・祝日)
function getDateCategory(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0: 日, 6: 土

  if (dayOfWeek === 0 || HOLIDAYS.includes(dateStr)) {
    return { type: "sunHoli", name: "日曜・祝日" };
  } else if (dayOfWeek === 6) {
    return { type: "sat", name: "土曜日" };
  } else {
    return { type: "weekday", name: "平日" };
  }
}

// 給与計算処理
function calculateSalary() {
  const dateStr = document.getElementById("workDate").value;
  const startTimeVal = document.getElementById("startTime").value;
  const endTimeVal = document.getElementById("endTime").value;
  const breakMinutes = parseInt(document.getElementById("breakMinutes").value) || 0;

  if (!dateStr || !startTimeVal || !endTimeVal) {
    alert("出勤日、開始時間、終了時間をすべて入力してください。");
    return;
  }

  // 日付区分の判定
  const dateCategory = getDateCategory(dateStr);

  // 時給の取得
  let dayWage = 0;
  let nightWage = 0;

  if (dateCategory.type === "weekday") {
    dayWage = parseFloat(document.getElementById("wageWeekdayDay").value) || 0;
    nightWage = parseFloat(document.getElementById("wageWeekdayNight").value) || 0;
  } else if (dateCategory.type === "sat") {
    dayWage = parseFloat(document.getElementById("wageSatDay").value) || 0;
    nightWage = parseFloat(document.getElementById("wageSatNight").value) || 0;
  } else {
    dayWage = parseFloat(document.getElementById("wageSunHoliDay").value) || 0;
    nightWage = parseFloat(document.getElementById("wageSunHoliNight").value) || 0;
  }

  // 時間設定 (日をまたぐ計算)
  const start = new Date(`${dateStr}T${startTimeVal}:00`);
  let end = new Date(`${dateStr}T${endTimeVal}:00`);
  
  if (end <= start) {
    // 終了時間が開始時間以前の場合、翌日と判定
    end.setDate(end.getDate() + 1);
  }

  // 総労働時間（分）と休憩時間の引去り割合の準備
  const totalWorkMinutes = (end - start) / (1000 * 60);
  let breakRemaining = breakMinutes;

  // 1分ごとの集計バケット
  let countBefore17 = 0;      // 17:00前 (通常時給)
  let countAfter17 = 0;       // 17:00〜22:00 / 05:00〜 (17時後時給)
  let countLateNightBefore17 = 0; // 22:00〜05:00 (17時前時給 × 1.25)
  let countLateNightAfter17 = 0;  // 22:00〜05:00 (17時後時給 × 1.25)

  let current = new Date(start);

  while (current < end) {
    const hours = current.getHours();
    const isLateNight = (hours >= 22 || hours < 5);
    const isBefore17 = (hours < 17);

    // 休憩時間は前から順に消化（簡易按分）
    if (breakRemaining > 0) {
      breakRemaining--;
    } else {
      if (isLateNight) {
        if (isBefore17) {
          countLateNightBefore17++;
        } else {
          countLateNightAfter17++;
        }
      } else {
        if (isBefore17) {
          countBefore17++;
        } else {
          countAfter17++;
        }
      }
    }
    current.setMinutes(current.getMinutes() + 1);
  }

  // 各時間区分の給与算出
  const hoursBefore17 = countBefore17 / 60;
  const hoursAfter17 = countAfter17 / 60;
  const hoursLateNightBefore17 = countLateNightBefore17 / 60;
  const hoursLateNightAfter17 = countLateNightAfter17 / 60;

  const payBefore17 = Math.round(hoursBefore17 * dayWage);
  const payAfter17 = Math.round(hoursAfter17 * nightWage);
  const payLateNightBefore17 = Math.round(hoursLateNightBefore17 * (dayWage * 1.25));
  const payLateNightAfter17 = Math.round(hoursLateNightAfter17 * (nightWage * 1.25));

  const totalPay = payBefore17 + payAfter17 + payLateNightBefore17 + payLateNightAfter17;

  // 結果表示
  document.getElementById("totalSalary").textContent = totalPay.toLocaleString();
  document.getElementById("dateTypeBadge").textContent = `区分: ${dateCategory.name}`;

  const detailsList = document.getElementById("detailsList");
  detailsList.innerHTML = "";

  const addDetailRow = (label, hours, rate, pay) => {
    if (hours > 0) {
      const row = document.createElement("div");
      row.className = "detail-row";
      row.innerHTML = `
        <span>${label} (${hours.toFixed(2)}h × ${rate}円)</span>
        <span>${pay.toLocaleString()} 円</span>
      `;
      detailsList.appendChild(row);
    }
  };

  addDetailRow("17時前", hoursBefore17, dayWage, payBefore17);
  addDetailRow("17時後", hoursAfter17, nightWage, payAfter17);
  addDetailRow("深夜 (17時前適用)", hoursLateNightBefore17, Math.round(dayWage * 1.25), payLateNightBefore17);
  addDetailRow("深夜 (17時後適用)", hoursLateNightAfter17, Math.round(nightWage * 1.25), payLateNightAfter17);

  document.getElementById("resultCard").style.display = "block";

  // 履歴保存
  saveHistory({
    date: dateStr,
    startTime: startTimeVal,
    endTime: endTimeVal,
    totalPay: totalPay,
    category: dateCategory.name
  });
}

// 履歴データのローカルストレージ保存と描画
function saveHistory(record) {
  let history = JSON.parse(localStorage.getItem("salary_history") || "[]");
  history.unshift(record); // 最新を先頭に追加
  if (history.length > 20) history.pop(); // 20件まで保持
  localStorage.setItem("salary_history", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("salary_history") || "[]");
  const historyList = document.getElementById("historyList");

  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-msg">履歴はありません</p>';
    return;
  }

  historyList.innerHTML = "";
  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-date">${item.date} (${item.category})</div>
      <div class="history-summary">
        <span>${item.startTime} ～ ${item.endTime}</span>
        <strong>${item.totalPay.toLocaleString()} 円</strong>
      </div>
    `;
    historyList.appendChild(div);
  });
}

function clearHistory() {
  if (confirm("履歴をすべて削除しますか？")) {
    localStorage.removeItem("salary_history");
    loadHistory();
  }
}
