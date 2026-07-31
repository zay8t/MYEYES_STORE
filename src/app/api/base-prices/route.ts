import { GET as adminGET, POST as adminPOST } from "../admin/base-prices/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export { adminGET as GET, adminPOST as POST };
