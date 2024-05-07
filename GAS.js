const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const sheet_id = SpreadsheetApp.getActiveSpreadsheet().getId();
const sheet_name = 'list'
const ss = SpreadsheetApp.openById(sheet_id);
const sheet = ss.getSheetByName(sheet_name);

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

    const targetString = arrObj[0].userId;
    const data = sheet.getDataRange().getValues();
    let matchingRow = -1;

    for(let i=0; i< data.length; i++){
        let row = data[i];
        
        // 特定の列(例えばA列)を検索対象とする場合
        if(row[0].toString().includes(targetString)){
            matchingRow = i + 1;
            break;
            //rows.push(row);
        }
    }

        // 特定の行を検索対象とする場合
        // if(row.join().includes(targetString)){
        //     rows.push(row);
        // }
    
    if(matchingRow !== -1){
        targetSheet.getRange(matchingRow, 1, 1, lastColumn).setValues(arrToWrite);
    } else {
        // getRange(横(行),縦(列),縦数(行数),横数(列数))
        targetSheet.getRange(splastRow + 1, 1, lastRow, lastColumn).setValues(arrToWrite);
    }
}

function doGet(e){
    try {
        // ユーザーIDが含まれるクエリパラメータを取得
        const userId = e.parameter.userId;

        // データを検索して取得
        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        const headers = values[0];
        const userIdIndex = headers.indexOf('userId');
        const userData = values.find(row => row[userIdIndex] === userId);

        // レスポンス用のデータを作成
        const response = {
            status: "success",
            data: userData,
        };

        // JSON形式でレスポンスを返す
        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);
    }catch(error){
        console.error('Error:', error.message);

        const response = {
            status: 'error',
            message: error.message,
        };
        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
