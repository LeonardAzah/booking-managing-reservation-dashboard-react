import { eo } from "date-fns/locale";
import supabase from "./superbase";

const SUPERBASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const getCabins = async () => {
  let { data, error } = await supabase.from("cabins").select("*");
  if (error) {
    console.error(error);
    throw new Error("Cabins could not be loaded");
  }
  return data;
};

export const deleteCabin = async (id) => {
  const { error } = await supabase.from("cabins").delete().eq("id", id);
  if (error) {
    console.error(error);
    throw new Error(`Unable to delete cabin with id ${id} `);
  }
};

export const createEditCabin = async (cabin, id) => {
  const hasImagePath = cabin.image?.startsWith?.(SUPERBASE_URL);
  const imageName = `${Math.random()}-${cabin.image.name}`.replaceAll("/", "");

  const imagePath = hasImagePath
    ? cabin.image
    : `${SUPERBASE_URL}/storage/v1/object/public/cabin-images/${imageName}`;
  //create cabin
  let query = supabase.from("cabins");
  //create
  if (!id) query = query.insert([{ ...cabin, image: imagePath }]);

  //edit
  if (id) query = query.update({ ...cabin, image: imagePath }).eq("id", id);
  const { data, error } = await query.select().single();

  if (error) {
    console.error(error);
    throw new Error("Unable to create cabin");
  }
  //upload image
  if (hasImagePath) return data;
  const { error: storageError } = await supabase.storage
    .from("cabin-images")
    .upload(imageName, cabin.image);
  if (storageError) {
    await supabase.from("cabins").delete().eq("id", data.id);
    console.log(storageError);
    throw new Error(
      "Cabin image could not be uploaded and the cabin was not created"
    );
  }
  return data;
};
