//The below code is just this(concept) and it's TYPE1 : plain function and easy to understand
//many company use the CLASS approach since they can be **`throw`n and be caught in middleware.** 

/*
function apiError(code, message) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
  */

//Type2:use of OOP concepet 

/*
class apiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong", 
        errors=[],
        stack=""
    )
    {
        super(message)
        this.statusCode=statusCode
        this.message=message
        this.data=null
        this.success=false
        this.errors=errors
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this.stack,this.constructor)
        }
    }
}

export {apiError}
*/

class apiError extends Error{
  constructor(
    statusCode,
    message="Something went wrong",
    errors=[],
    stack=""  
  ){
    super(message)
    this.statusCode=statusCode
    this.errors=errors
    if(stack){
      this.stack=stack
    }
    else{
      Error.captureStackTrace(this,this.constructor)
    }
    this.data=null
    this.success=false
  
  }
}
export {apiError}