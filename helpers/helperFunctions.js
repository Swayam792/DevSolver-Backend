export const paginatedResult = (page, limit, docCount) => {
    const startIndex = (page - 1)*limit;
    const endIndex = page*limit;
    const results = {};

    if(endIndex < docCount){
        results.next = {
            page: page+1,
            limit
        }
    }
    
    if(startIndex > 0){
        results.previous = {
            page: page-1,
            limit
        }
    }

    return {
        startIndex,
        endIndex,
        results
    };
};

export const upvoteIt = (quesAns, user) => {
    if(quesAns.upvotedBy.includes(user._id.toString())) {
        quesAns.upvotedBy = quesAns.upvotedBy.filter((u) => u.toString() !== user._id.toString());
    }else{
        quesAns.upvotedBy.push(user._id);
        quesAns.downvotedBy = quesAns.downvotedBy.filter((d) => d.toString() !== user._id.toString());
    }

    quesAns.points = quesAns.upvotedBy.length - quesAns.downvotedBy.length;
    return quesAns;
}

export const downvoteIt = (quesAns, user) => {
    if(quesAns.downvotedBy.includes(user._id.toString())){
        quesAns.downvotedBy = quesAns.downvotedBy.filter((d) => {
            d.toString !== user._id.toString()
        });
    }else{
        quesAns.downvotedBy.push(user._id);
        quesAns.upvotedBy = quesAns.upvotedBy.filter((d) => d.toString() !== user._id.toString());
    }

    quesAns.points = quesAns.upvotedBy.length - quesAns.downvotedBy.length;
    return quesAns;
}

export const quesRep = (question, author) => {
    const calculatedRep = question.upvotedBy.length * 10 - question.downvotedBy.length*2;

    author.questions = author.questions.map((q) => q.quesId.equals(question._id)? { quesId : q.quesId, rep: calculatedRep} : q);

    return author;
}

export const ansRep = (answer, author) => {
    const calculatedRep = answer.upvotedBy.length*10 - answer.downvotedBy*2;

    author.answers = author.answers.map((a) => a.ansId.equals(answer._id)? { ansId : a.ansId, rep: calculatedRep} : a);

    return author;
}