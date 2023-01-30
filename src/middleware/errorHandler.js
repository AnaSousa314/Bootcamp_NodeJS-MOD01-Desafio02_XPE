const errorHandler = (error,req,res,next)=> {
  console.log("### Error Handler");
  console.log('error',error);
  res.sendStatus(500);
  logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);  
}

export default errorHandler;