const prerender = true;
const load = () => {
  console.log("server");
  return {
    post: {
      title: `Title for $ goes here`,
      content: `Content for  goes here`
    }
  };
};
export {
  load,
  prerender
};
