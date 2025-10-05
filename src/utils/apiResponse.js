//type-1:simple and easy.plain function use. *Many company prefer function approach for reesponses since we usually return them and not throwa
/*
function apiResponse(message, data = null) {
  return {
    success: true,
    message,
    data,
  };
}
*/
//OR another approach using constructor
 class apiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode=statusCode,
        this.message=message,
        this.data=data,
        this.success= statusCode<400
    }
}

export {apiResponse}
