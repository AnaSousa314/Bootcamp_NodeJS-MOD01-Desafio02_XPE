import { Router } from "express";
import {promises as fs} from "fs";

const { readFile, writeFile} = fs;

const router = Router();

router.get("/list", async(req, res, next)=>{
  try {
    const data =  JSON.parse(await readFile(global.fileName));

    res.send(data);
    logger.info(`GET /orders/list`)
  } catch (err) {
    next(err)
  }
});

router.post("/newOrder", async(req,res,next)=>{
  try {
    let order = req.body;
    const data = JSON.parse(await readFile(global.fileName));
  
    if (!order.cliente || !order.produto || order.valor == null) {
      throw new Error("Cliente, Produto e Valor são obrigatórios.");
    }

    order = {
      id: data.nextId++,
      cliente: order.cliente,
      produto: order.produto,
      valor: order.valor,
      entregue: false,
      timestamp: new Date()
    }


    data.pedidos.push(order);

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    res.status(201).send(order);
    logger.info(`POST /orders/newOrder - ${JSON.stringify(order)}`);
  } catch (err) {
    next(err)
  }
});

router.get("/findOrder/:id", async(req,res,next)=>{
  try {
    const data = JSON.parse(await readFile(global.fileName));

    let order = data.pedidos.find((item) => item.id === parseInt(req.params.id))

    res.status(200).send(order);
    logger.info(`GET /orders/findOrder/:id`);
  } catch (err) {
    next(err)
  }
});

router.delete("/delete/:id", async(req,res,next)=>{
  try {
    const data = JSON.parse(await readFile(global.fileName));

    data.pedidos = data.pedidos.filter(order => order.id !== parseInt(req.params.id));
      
    await writeFile("pedidos.json", JSON.stringify(data, null, 2));

    res.sendStatus(204)
    res.end()
    logger.info(`DELETE /orders/delete/:id - ${req.params.id}`)
  } catch (err) {
    next(err)
  }
});

router.put("/update", async(req,res,next) => {
  try {
    const order = req.body;
    
    if (!order.id || !order.cliente || !order.produto || !order.valor || !order.entregue == null) {
      throw new Error("Id, cliente, produto, valor e entregue são obrigatórios!")
    }

    const data = JSON.parse(await readFile(global.fileName));
  
    const index = data.pedidos.findIndex(item => item.id === parseInt(order.id));
    
    if (index === -1){
      throw new Error("Registro não encontrado!");
    }

    data.pedidos[index].cliente = order.cliente;
    data.pedidos[index].produto = order.produto;
    data.pedidos[index].valor = order.valor;
    data.pedidos[index].entregue = order.entregue;

    await writeFile("pedidos.json", JSON.stringify(data, null, 2));

    res.status(200).send(order);
    logger.info(`PUT /orders/update - ${JSON.stringify(order)}`)
  } catch (err) {
    next(err)
  }
});

router.patch("/update", async (req,res,next)=>{
  try {
    const order = req.body;
    
    if (!order.id || order.entregue == null) {
      throw new Error("Id e entregue são obrigatórios!")
    }

    const data = JSON.parse(await readFile(global.fileName));
  
    const index = data.pedidos.findIndex(item => item.id === parseInt(order.id));
    
    if (index === -1){
      throw new Error("Registro não encontrado 2!");
    }

    data.pedidos[index].entregue = order.entregue;

    await writeFile("pedidos.json", JSON.stringify(data, null, 2));

    res.status(200).send(data.pedidos[index]);
    logger.info(`PATCH /orders/update - ${JSON.stringify(order)}`)
  } catch (err) {
    
  }
});

router.get("/mostSold", async(req,res,next)=>{
  try {
    const data = JSON.parse(await readFile(global.fileName));
    let product = []

    data.pedidos.forEach(element => {
      if(element.entregue === true){
        product.push(element.produto);
      }
    });
    
    const occurrences = product.reduce((acc, curr)=>{
      return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
    }, [])


    let most = []
    for (const key in occurrences) {
      most.push({produto: key, qtd: occurrences[key]})
    }

    most = most.sort((a,b) => {
      return a.qtd < b.qtd ? 1 : -1
    })

    res.status(200).send(most);
    logger.info(`GET /orders/mostSold`)
    
  } catch (err) {
    next(err)
  }
});

router.get("/total/:client", async(req,res,next)=>{
  try {
    const data = JSON.parse(await readFile(global.fileName));

    if (req.params.client === "") {
      res.sendStatus(400)
      throw new Error("Coloque o nome do cliente")
    }

    let ordersClientTotal = data.pedidos.filter((item) => {
      if ((item.cliente != undefined && item.cliente) && (item.entregue == true)){
        return item.cliente.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/ /g,"").toLowerCase().includes(req.params.client.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/ /g,"").toLowerCase())
      }
    }).reduce((a,b) => a + b.valor, 0)

    console.log(ordersClientTotal);
    ordersClientTotal = {cliente: req.params.client, total: ordersClientTotal}
    
    res.status(200).send(ordersClientTotal)
    logger.info(`GET /orders/total/:client - ${req.params.client}`)
  } catch (err) {
    next(err)
  }
});

router.get("/totalProduct/:product", async(req,res,next)=>{
  try {
    const data = JSON.parse(await readFile(global.fileName));

    if (req.params.product === "") {
      res.sendStatus(400)
      throw new Error("Coloque o nome do cliente")
    }

    let ordersProductTotal = data.pedidos.filter((item) => {
      if ((item.produto != undefined && item.produto) && (item.entregue == true)){
        return item.produto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/ /g,"").toLowerCase().includes(req.params.product.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/ /g,"").toLowerCase())
      }
    }).reduce((a,b) => a + b.valor, 0)

    console.log(ordersProductTotal);
    ordersProductTotal = {produto: req.params.product, total: ordersProductTotal}
    
    res.status(200).send(ordersProductTotal)
    logger.info(`GET /orders/totalProduct/:product - ${req.params.product}`)
  } catch (err) {
    next(err)
  }
});

router.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);    
  res.status(400).send({ error: err.message });    
});

export default router;