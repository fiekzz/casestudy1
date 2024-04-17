import { prisma } from "./src/app/prisma";
import cuid from "cuid";

const createUser = async () => {

    const roleNames = ["staff"]
    
    try {
        
        const role = await prisma.roles.findMany({
            where: {
                roleName: {
                    in: roleNames
                }
            },
            select: {
                roleID: true,
                roleName: true
            }
        })

        if (!role) {
            throw new Error("Role not found");
        }

        // Fikri
        // maklu12345 admin
        // waklu12345 staff

        // Luqman
        // luqq12345 admin
        // kimm12345 staff

        const password = await Bun.password.hash("kimm12345")

        await prisma.users.create({
            data: {
                userID: cuid(),
                email: "luqmanstaff@gmail.com",
                password: password,
                fullName: "Luqmam Staff",
                // connect all roles to user based on rolename
                roles: {
                    connect: role.map((r) => {
                        return {
                            roleID: r.roleID
                        }
                    })
                }
            }
        })

        console.log("User created");

    } catch (error) {
        console.log(error);
    }


}

const createRole = async () => {

    try {

        await prisma.roles.create({
            data: {
                roleID: cuid(),
                roleName: "staff",
                rate: 8
            }
        })

        console.log("Role created");

    } catch (error) {

        console.log(error);

    }


}

await createUser();