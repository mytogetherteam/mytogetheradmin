import * as XLSX from "xlsx";
import type {
  ManageUser,
  ManageUserAccountType,
} from "@/schemas/manage-user.schema";

export type AccountFilter = ManageUserAccountType;

/** Options shown in the account-type filter dropdown. */
export const ACCOUNT_FILTER_OPTIONS: { value: AccountFilter; label: string }[] =
  [
    { value: "user", label: "Users" },
    { value: "admin", label: "Admins" },
  ];

/** Best available human label for a user/admin row. */
export function getUserDisplayName(user: ManageUser): string {
  return user.name || user.username || `User ${user.id}`;
}

/** Export the given (already sorted) rows to an `.xlsx` file. */
export function exportManageUsersToExcel(
  users: ManageUser[],
  rowOffset: number,
): void {
  const rows = users.map((user, index) => ({
    ID: rowOffset + index + 1,
    Type: user.accountType,
    Name: getUserDisplayName(user),
    Email: user.email,
    Phone: user.phone || "",
    Username: user.username || "",
    Role: user.role,
    Status: user.status,
    "Created At": user.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Manage Users");
  XLSX.writeFile(workbook, "ManageUsers.xlsx");
}
