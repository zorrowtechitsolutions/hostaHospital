import * as XLSX from "xlsx";

export const exportToExcel = ({
  data,
  fileName = "export",
  sheetName = "Sheet1",
  minWidth = 10,
  maxWidth = 50,
}) => {
  if (!data?.length) return;

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-calculate column widths based on content
  if (data?.length > 0) {
    const headers = Object.keys(data[0]);
    
    // Initialize widths with header length
    const columnWidths = headers.map((header) => ({
      wch: Math.max(header.length + 2, minWidth),
    }));

    // Calculate max width for each column based on data
    data.forEach((row) => {
      headers.forEach((header, index) => {
        const cellValue = row[header]?.toString() || "";
        const cellLength = cellValue.length + 2; // Add padding
        if (cellLength > columnWidths[index].wch) {
          columnWidths[index].wch = Math.min(cellLength, maxWidth);
        }
      });
    });

    worksheet["!cols"] = columnWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};