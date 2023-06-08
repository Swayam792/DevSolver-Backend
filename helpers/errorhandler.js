const errorHandler = (err) => {
    if(err.name === 'CastError' && err.kind === 'ObjectId'){
        return 'Not formatted Id.';
    }else{
        return err.message;
    }
};

export default errorHandler;