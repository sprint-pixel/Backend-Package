//const asyncHandler = ()=>{}


//const asyncHandler = () =>()
//comst asyncHandler = (func) => () => {}
//const asyncHandler = (func) => async () => {} 

//this is *TYPE-1*:aync await

/* const asyncHandler= (fn)=>async (req,res,next) =>{
    try{
        await fn(req,res,next)
    }
    catch(error){
        res.status(error.code|| 500).json({
            success:false,
            message:error.message
        })

    }

} */

    //this is *TYPE-2*:PROMISE
const asyncHandler=(func)=>{
    return (req,res,next)=>{ 
        Promise.resolve(func(req,res,next))
        .catch((err)=>next(err))
    }
} 