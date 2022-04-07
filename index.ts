import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient({
    log: ['error', 'info', 'query', 'warn']
})

function createToken(id: number) {
    //@ts-ignore
    const token = jwt.sign({ id: id }, process.env.MY_SECRET, { expiresIn: '3days' })
    return token
}

async function getUserFromToken(token: string) {
    //@ts-ignore
    const data = jwt.verify(token, process.env.MY_SECRET)
    const user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: data.id },
        include: { players: true }
    })

    return user
}


app.get('/players', async (req, res) => {
    const token = req.headers.authorization || ''
    try {
        const user = await getUserFromToken(token)

        const players = await prisma.player.findMany({ where: { userId: user?.id } })
        res.send(players)
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.get('/players/:id', async (req, res) => {
    const token = req.headers.authorization || ''

    const id = Number(req.params.id)
    try {
        const user = await getUserFromToken(token)

        const players = await prisma.player.findUnique({ where: { id: id } })
        res.send(players)
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.post('/sign-up', async (req, res) => {
    const { email, password, name } = req.body

    try {
        const hash = bcrypt.hashSync(password)
        const user = await prisma.user.create({
            data: { email: email, password: hash, name: name },
            include: { players: true }
        })
        res.send({ user, token: createToken(user.id) })
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: { players: true }
        })
        // @ts-ignore
        const passwordMatches = bcrypt.compareSync(password, user.password)
        if (user && passwordMatches) {
            res.send({ user, token: createToken(user.id) })
        } else {
            throw Error('Boom')
        }
    } catch (err) {
        res.status(400).send({ error: 'Email/password invalid.' })
    }
})

app.get('/validate', async (req, res) => {
    const token = req.headers.authorization || ''

    try {
        const user = await getUserFromToken(token)
        res.send(user)
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.post('/players', async (req, res) => {

    const token = req.headers.authorization || ''
    const { fullName, position, team, status } = req.body

    try {
        const user = await getUserFromToken(token)

        const player = await prisma.player.create({
            //@ts-ignore
            data: { fullName: fullName, position: position, team: team, status: status, userId: user.id },
            include: { user: true }
        })
        const players = await prisma.player.findMany({ where: { userId: user?.id } })
        res.send(players)
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }

})

app.patch('/player/:id', async (req, res) => {
    const token = req.headers.authorization || ''
    const id = Number(req.params.id)
    const { fullName, position, team, status } = req.body

    try {
        const user = await getUserFromToken(token)

        const updatedPlayer = await prisma.player.update({
            // @ts-ignore
            where: { id: id },
            data: { fullName: fullName, position: position, team: team, status: status },
            include: { user: true }
        })
        res.send(updatedPlayer)
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})

app.delete('/players/:id', async (req, res) => {
    const token = req.headers.authorization || ''
    const id = Number(req.params.id)

    try {
        const user = await getUserFromToken(token)

        const player = await prisma.player.findUnique({ where: { id: id } })

        if (player?.userId === user?.id) {
            // if it does: delete it
            await prisma.player.delete({ where: { id: id } })
            const players = await prisma.player.findMany({ where: { userId: user?.id } })
            res.send(players)
        } else {
            // if it does not: tell them they are not authorised
            res
                .status(401)
                .send({ error: 'You are not authorised to do delete this photo.' })
        }
    } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message })
    }
})



app.listen(4000, () => {
    console.log(`Server up: http://localhost:4000`)
})