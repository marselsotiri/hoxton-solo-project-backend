import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const players: Prisma.PlayerCreateInput[] = [
    {
        fullName: "Marsel Sotiri",
        position: "SHT",
        team: "Flamurtari",
        user: { connect: { id: 1 } }
    },
    {
        fullName: "Armelind Sotiri",
        position: "SF",
        team: "Flamurtari",
        user: { connect: { id: 1 } }
    }
]


const users: Prisma.UserCreateInput[] = [
    {
        email: "marsel@email.com",
        name: "Marsel",
        password: bcrypt.hashSync('marsel')

    }
]




async function createStuff() {

    for (const user of users) {
        await prisma.user.create({ data: user })
    }

    for (const player of players) {
        await prisma.player.create({ data: player })
    }


}

createStuff()