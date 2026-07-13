import { Download } from "lucide-react";
import { exportToExcel } from "../../utils/excelExport";

const ExcelExportButton = ({
  data,
  fileName,
  sheetName = "Sheet1",
  className = "",
}) => {
  return (
    <button
      onClick={() =>
        exportToExcel({
          data,
          fileName,
          sheetName,
        })
      }
      className={className}
      title="Export Excel"
    >
      <Download size={16} />
    </button>
  );
};

export default ExcelExportButton;