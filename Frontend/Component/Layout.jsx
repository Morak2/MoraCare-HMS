import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div style={styles.wrapper}>
      <Navbar />
      <main style={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  main: {
    padding: "2rem",
    flex: 1,
  },
};
