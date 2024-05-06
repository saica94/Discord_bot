const sheet_id = '****************'
const sheet_name = 'シート1';
const ss = SpreadsheetApp.openById(sheet_id);

function doPost(e){
    try {
        const res = doPostProxy(e);
        return res;
    } catch (err){
        return ContentService.createTextOutput(JSON.stringify({ result: err.stack}))
    }
}

function doPostProxy(e){
    const reqParam = JSON.parse(e.postData.getDataAsString());
    const sheetNo = parseInt(reqParam.sheetNo) || 1;
    // シートの取得
    const targetSheet = ss.getSheets()[sheetNo - 1];
    // data プロパティの取得
    var data = reqParam.data;
    postJsonToSpreadSheet(data, targetSheet);
    return ContentService.createTextOutput(JSON.stringify({ result: "post done"}))
}

function postJsonToSpreadSheet(arrObj, targetSheet){
    const splastRow = targetSheet.getLastRow();
    // 受け付けるJSONは [{key1:data1, key2:data2}]
    // オブジェクトが配列になっている形式
    // オブジェクトのキーがスプレッドシートの項目名として1行目に入力される
    // targetSheet.clear();
    // タイトル行書き込み
    const keys = [Object.keys(arrObj[0])];
    targetSheet.getRange(1, 1, 1, keys[0].length).setValues(keys);
    const arrToWrite = arrObj.map((obj) => {
        const arr = [];
        for(const key of keys[0]) { arr.push(obj[key]); }
        return arr;
    });
    const lastColumn = arrToWrite[0].length;
    const lastRow = arrToWrite.length;
    targetSheet.getRange(splastRow + 1, 1, lastRow, lastColumn).setValues(arrToWrite);
}
