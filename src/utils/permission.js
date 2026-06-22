export const hasPermission = (permissionId) => {
  const permissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );

  return permissions.some(
    (item) => item.permissionId === permissionId
  );
};