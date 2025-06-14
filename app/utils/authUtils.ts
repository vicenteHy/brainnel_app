/**
 * 检查401错误是否为多设备登录冲突
 */
export const isMultipleDeviceLoginError = (error: any): boolean => {
  // 检查是否为401错误，并且包含"无效的身份凭证"或"invalid credentials"等信息
  return (
    error?.response?.status === 401 && 
    (error?.response?.data?.detail === "无效的身份凭证" ||
     error?.response?.data?.detail?.includes("无效的身份凭证") ||
     error?.response?.data?.message?.includes("invalid") ||
     error?.response?.data?.message?.includes("credentials"))
  );
};