function Error({ statusCode }) {
    return null;
  }
  
  // This static method prevents using context during build
  Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
  }
  
  export default Error;