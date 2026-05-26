const XLSX = require('xlsx');
const pathMaster = "C:\\Users\\Filmk\\Downloads\\TMTRF20260518\\TMTRF20260518_BONUS\\MasterTMT_20260518.xls";

try {
  console.log("Reading MasterTMT workbook...");
  const workbook = XLSX.readFile(pathMaster);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Convert sheet to array of rows
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`Total records in MasterTMT: ${data.length}`);
  
  // 1. Analyze unique Status values
  const statusCounts = {};
  data.forEach((row) => {
    const status = row.Status !== undefined ? row.Status : "undefined";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  console.log("\nStatus Counts:");
  console.log(statusCounts);
  
  // 2. Search for CIMINPAC
  console.log("\nSearching for 'CIMINPAC'...");
  const ciminpacRecords = data.filter((row) => {
    const tn = String(row.TradeName || "").toLowerCase();
    const fsn = String(row.FSN || "").toLowerCase();
    return tn.includes("ciminpac") || fsn.includes("ciminpac");
  });
  
  if (ciminpacRecords.length > 0) {
    console.log(`Found ${ciminpacRecords.length} records:`);
    ciminpacRecords.forEach((row) => {
      console.log(`  TPUCode: ${row.TPUCode} | TradeName: ${row.TradeName} | ActiveIngredient: ${row.ActiveIngredient} | Status: ${row.Status}`);
    });
  } else {
    console.log("No records found for 'CIMINPAC'!");
  }
  
  // 3. Search for Cimetidine in general to check if it's there
  console.log("\nSearching for 'cimetidine'...");
  const cimetidineRecords = data.filter((row) => {
    const ai = String(row.ActiveIngredient || "").toLowerCase();
    return ai.includes("cimetidine");
  });
  console.log(`Total 'cimetidine' records: ${cimetidineRecords.length}`);
  if (cimetidineRecords.length > 0) {
    console.log("First 5 cimetidine records:");
    cimetidineRecords.slice(0, 5).forEach((row) => {
      console.log(`  TPUCode: ${row.TPUCode} | TradeName: ${row.TradeName} | Status: ${row.Status}`);
    });
    
    // Status counts for cimetidine
    const cimStatus = {};
    cimetidineRecords.forEach((row) => {
      cimStatus[row.Status] = (cimStatus[row.Status] || 0) + 1;
    });
    console.log("Cimetidine Status breakdown:", cimStatus);
  }
  
} catch (error) {
  console.error("Error analyzing TMT Master:", error);
}
