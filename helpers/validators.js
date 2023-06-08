export const loginValidator = (username, password) => {
    const errors = {};
  
    if (username.trim() == '') {
      errors.username = 'Username field must not be empty.';
    }
  
    if (!password) {
      errors.password = 'Password field must not be empty.';
    }
  
    return {
      errors,
      valid: Object.keys(errors).length < 1,
    };
};

export const registerValidator = (username, password) => {
    const errors = {};
    if (username.trim() == "" || username.length > 20 || username.length < 3) {
        errors.username = "Username must be of length between 3-20!";
    }
    if(!/^[a-zA-Z0-9-_]*$/.test(username)){
        errors.username = 'Username must have alphanumeric characters only!';
    }
    if (password == "" || password.length < 6) {
        errors.password = "Password must be atleast 6 character!";
    }
    return {
        errors,
        valid: Object.keys(errors).length < 1,
    };
}

export const questionValidator = (title, body, tags) => {
  const errors = {};

  if(title.trim() === '' || title.length < 15){
    errors.title = 'Title must be of atleast 15 characters.';
  }

  if(title.trim() === '' || body.length < 30){
    errors.body = 'Body must be of atleast 30 characters.';
  }

  if(!Array.isArray(tags) || tags.length === 0 || tags.length > 5){
    errors.tags = 'Tags must be an array of length between 1-5.';
  }

  if(tags.some((t) => !/^[a-zA-Z-0-9-]*$/.test(t))){
    errors.tags = 'Tags must have alphanumeric characters only.';
  }

  if(tags.filter((t, index) => tags.indexOf(t) !== index).length > 0){
    errors.tags = 'Duplicate tags cannot be added.';
  }

  if(tags.some((t) => t.length > 30)){
    errors.tags = "A single tag can't have more than 30 letter.";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};