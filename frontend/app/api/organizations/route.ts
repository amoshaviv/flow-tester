import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

export const PUT = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization } = dbModels;
  if (!email)
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  const user = User.findByEmail(email);
  const organization = Organization 

  console.log(token);
  return NextResponse.json({});
};
