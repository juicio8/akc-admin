import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "./../firebase/config";
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { error, success } from "../components/utils";
import { useParams } from "react-router-dom";

const defaultProduct = {
  name: "",
  category: "hand bags",
  image: "",
  carousel: [],
  top_position: false,
  dimensions: "",
  price: "",
  bulk_price: "",
  wholesale_price: "",
  description: "",
};
const EditProduct = () => {
  const [product, setProduct] = useState(defaultProduct);
  const [loading, setLoading] = useState(false);
  const [imageTransfer, setImageTransfer] = useState(0);
  const { id } = useParams();

  const productsCollectionRef = collection(db, "products");

  useEffect(() => {
    setLoading(true);
    const getProducts = async () => {
      const data = await getDocs(productsCollectionRef);
      if (data.docs.length > 0) {
        const product = data.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .find((product) => id == product.id);
        setProduct(product);
        setLoading(false);
      } else {
        error();
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name.includes("price") && value.length) value = Number(value);
    setProduct({ ...product, [name]: value });
  };
  const handleImageChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    const folder = name === "image" ? "images" : "carousels";
    const storageRef = ref(storage, `${folder}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageTransfer(progress);
      },
      (error) => {
        console.error(error);
        error();
        setProduct(defaultProduct);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          if (folder === "images") {
            setProduct({ ...product, image: downloadURL });
          } else if (folder === "carousels") {
            setProduct({
              ...product,
              carousel: [...product.carousel, downloadURL],
            });
          }
          // toast.success("Image uploaded successfully.");
        });
      }
    );
  };
  async function handleDeleteImage(image) {
    try {
      const storageRef = ref(storage, image);
      await deleteObject(storageRef);
      setProduct({ ...product, image: "" });
    } catch (err) {
      error();
    }
  }
  async function handleDeleteCarousel(cindex) {
    try {
      const storageRef = ref(storage, product.carousel[cindex]);
      await deleteObject(storageRef);
      const newCarousel = product.carousel.filter(
        (carousel, index) => index !== cindex
      );
      setProduct({ ...product, carousel: newCarousel });
    } catch (err) {
      console.log(err);
      error();
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const docRef = await setDoc(doc(db, "products", id), product);
    if (docRef) {
      setLoading(false);
      return error();
    }
    setLoading(false);
    return success();
  };
  const signal =
    imageTransfer < 45
      ? "text-red-400 border-red-400"
      : imageTransfer < 70
      ? "text-green-300 border-green-300"
      : "text-green-700 border-green-700";
  return (
    <div className="px-3">
      {imageTransfer && (
        <div
          className={`fixed flex justify-center items-center top-20 left-0 w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full font-bold text-center text-lg bg-white border-2 ${signal}`}
        >
          {imageTransfer.toFixed()}%
        </div>
      )}
      <div className="mt-24 max-w-[800px] mx-auto border-2 border-dotted border-blue-700 py-5 px-14 mb-10 rounded-md">
        <h1 className="text-2xl text-gray-600 font-bold mb-3">Edit Product</h1>
        <form className="py-5 " onSubmit={handleSubmit}>
          <label htmlFor="name">Product Name:</label>
          <input
            type="text"
            name="name"
            id="name"
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            value={product.name}
            onChange={(e) => handleChange(e)}
          />
          <label htmlFor="category" className="block mt-3">
            Product Category:
          </label>
          <select
            name="category"
            id="category"
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            value={product.category}
            onChange={(e) => handleChange(e)}
          >
            <option value="hand bags">Hand Bags</option>
            <option value="laptop bags">Laptop Bags</option>
            <option value="duffels">Duffels</option>
            <option value="footwears">Footwears</option>
            <option value="accessories">Accessories</option>
            <option value="Others">Others</option>
          </select>

          <label htmlFor="image" className="block mt-3">
            Product Image:
            {product.image.length > 0 && (
              <div className="mb-3 border border-dotted border-blue-700 flex gap-3 items-center">
                <img src={product.image} alt="image" width={60} />{" "}
                <button
                  className="text-white bg-red-500 rounded px-2"
                  onClick={() => handleDeleteImage(product.image)}
                >
                  Delete
                </button>
              </div>
            )}
          </label>
          <input
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            type="file"
            accept="image/*"
            name="image"
            id="image"
            onChange={(e) => handleImageChange(e)}
          />

          <label htmlFor="image" className="w-full mt-3 block">
            Carousel:
          </label>
          {product.carousel.length > 0 && (
            <div className="mb-3 border border-dotted border-blue-700">
              {product.carousel.map((carousel, index) => (
                <div
                  key={carousel}
                  className="flex items-center gap-3 px-2 mb-2"
                >
                  <img src={carousel} alt="" width={40} />
                  <button
                    className="bg-red-500 text-white rounded px-2"
                    onClick={() => handleDeleteCarousel(index)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            type="file"
            accept="image/*"
            name="carousel"
            id="carousel"
            onChange={(e) => handleImageChange(e)}
          />
          <label htmlFor="top_position" className="w-full block mt-3">
            Top-Position:
          </label>
          <select
            name="top_position"
            id="top_position"
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            value={product.top_position}
            onChange={(e) => handleChange(e)}
          >
            <option value={false}>false</option>
            <option value={true}>true</option>
          </select>

          <label htmlFor="dimensions" className="w-full block mt-3">
            Dimensions:
          </label>
          <input
            type="text"
            name="dimensions"
            id="dimensions"
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            value={product.dimensions}
            onChange={(e) => handleChange(e)}
          />
          <label htmlFor="price" className="w-full mt-3 block">
            Price:
          </label>
          <input
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            type="number"
            step={0.01}
            name="price"
            id="price"
            required
            value={product.price}
            onChange={(e) => handleChange(e)}
          />
          <label htmlFor="bulk_price" className="w-full mt-3 block">
            Bulk price:
          </label>
          <input
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            type="number"
            name="bulk_price"
            id="bulk_price"
            value={product.bulk_price}
            onChange={(e) => handleChange(e)}
          />
          <label htmlFor="whole_sale" className="w-full mt-3 block">
            Wholesale price:
          </label>
          <input
            className="w-full p-2 border border-gray-700 focus:outline-blue-700 rounded-md"
            name="wholesale_price"
            type="number"
            id="whole_sale"
            value={product.wholesale_price}
            onChange={(e) => handleChange(e)}
          />
          <label htmlFor="description" className="w-full mt-3 block">
            Description:
          </label>
          <textarea
            className="w-full border border-gray-700 focus:outline-blue-700 rounded-md p-2 h-24"
            type="text"
            name="description"
            id="description"
            value={product.description}
            onChange={(e) => handleChange(e)}
          />
          <button
            className="h-12 w-36 flex justify-center items-center bg-blue-700 text-white rounded-md mt-3"
            disabled={loading ? true : false}
          >
            {!loading ? (
              "Update Product"
            ) : (
              <Oval
                height={40}
                width={40}
                color="#fff"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel="oval-loading"
                secondaryColor="#1D4ED8"
                strokeWidth={2}
                strokeWidthSecondary={2}
              />
              // <Oval
              //   ariaLabel="loading-indicator"
              //   height={30}
              //   width={30}
              //   strokeWidth={1}
              //   strokeWidthSecondary={2000}
              //   color="white"
              //   secondaryColor="red"
              // />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
