import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import type { AccountDataExportDto } from "@/features/auth/types/account.types";

// yyyymmdd in UTC — matches the BE filename (account-export-{id:N}-{yyyyMMdd}.json)
const formatDateUtc = (d: Date): string =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;

const triggerDownload = (data: AccountDataExportDto) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const idCompact = data.account.id.replace(/-/g, "");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `account-export-${idCompact}-${formatDateUtc(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

// #AUTH-62: GDPR export — axios does NOT unwrap → read res.data.data → build Blob → download file
export const useExportMyData = () =>
  useMutation({
    mutationFn: async () => {
      const res = await accountService.exportMyData();
      const data = res.data.data;
      if (data) triggerDownload(data);
      return data;
    },
  });
