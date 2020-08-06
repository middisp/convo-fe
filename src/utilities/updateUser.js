const updateUser = (data, token) => {
  fetch(`http://localhost:3001/user/update/${data._id}`, {
    method: "put",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer: ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      if (result.statusCode) {
        alert.set({ message: result.message, type: "error" });
      }
    })
    .catch(e => {
      alert.set({ message: e, type: "error" });
      console.log(e);
    });
};

export default updateUser;