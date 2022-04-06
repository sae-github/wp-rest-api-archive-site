const archiveWrapper = document.getElementById("js-archive-wrapper");
const archiveList = document.getElementById("js-archive-list");
let totalPosts;

const createElementWithClassName = (type, name) => {
  const element = document.createElement(type);
  element.className = name;
  return element;
};

const renderLoading = (parent) => {
  const loading = createElementWithClassName("div", "loading");
  const img = document.createElement("img");
  loading.id = "js-loading";
  img.src = "./img/loading-circle.gif";
  parent.appendChild(loading).appendChild(img);
};

const removeLoading = () => document.getElementById("js-loading").remove();

const getResponseOrError = async (api) => {
  const response = await fetch(api);
  if (response.ok) {
    return response;
  } else {
    throw new Error("サーバーエラーが発生しました");
  }
};

const renderErrorMessage = (error, parent) => {
  const errorMessage = createElementWithClassName("p", "error-message");
  errorMessage.textContent = error;
  parent.appendChild(errorMessage);
};

const getTotalPosts = (response) => response.headers.get("X-WP-Total");

const getPostsData = async (api, loading = false) => {
  loading && renderLoading(loading);
  let response;
  try {
    response = await getResponseOrError(api);
    const data = await response.json();
    return data;
  } catch (e) {
    renderErrorMessage(e, parent);
  } finally {
    totalPosts = getTotalPosts(response);
    loading && removeLoading();
  }
};

const initArchiveList = () => (archiveList.textContent = "");

const renderCategorySelect = (data) => {
  const selectWrapper = document.getElementById("js-archive-select-wrapper");
  const select = document.createElement("select");
  select.addEventListener("change", async (e) => {
    archiveList.textContent = "";
    const selectedCategoryData = await getSelectedCategoryData(e.target.value);
    if (selectedCategoryData.length === 0) {
      archiveList.textContent = "選択されたカテゴリーの記事がありません";
      return;
    }
    renderSelectedCategoryList(selectedCategoryData);
  });
  selectWrapper.appendChild(select).appendChild(createSelectOptions(data));
};

const createSelectOptions = (data) => {
  const frag = document.createDocumentFragment();
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "未選択";
  defaultOption.value = "default";
  frag.appendChild(defaultOption);
  data.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.name;
    frag.appendChild(option);
  });
  return frag;
};

const getSelectedCategoryData = async (target) => {
  const postAPI = new URL("https://itosae.com/wp-json/wp/v2/posts?_embed");
  postAPI.searchParams.set("per_page", 5);
  target !== "default" && postAPI.searchParams.set("categories", target);
  return await getPostsData(postAPI, archiveList);
};

const renderSelectedCategoryList = async (postData) => {
  archiveList.textContent = "";
  postData.forEach((d) => archiveList.appendChild(createArticleItem(d)));
};

const renderArchiveList = (data) => {
  const frag = document.createDocumentFragment();
  data.forEach((d) => frag.appendChild(createArticleItem(d)));
  archiveList.appendChild(frag);
};

const createArticleDate = (data) => {
  const date = createElementWithClassName("p", "archive__item-date");
  const time = document.createElement("time");
  const format = new Date(data.date);
  date.textContent = `${format.getFullYear()}.${format.getMonth()}.${format.getDate()}`;
  date.appendChild(time);
  return date;
};

const createArticleItem = (data) => {
  const frag = document.createDocumentFragment();
  const archiveItem = createElementWithClassName("li", "archive__item");
  const archiveLink = createElementWithClassName("a", "archive__item-link");
  const archiveWrapper = createElementWithClassName(
    "div",
    "archive__item-text"
  );
  const title = createElementWithClassName("p", "archive__item-title");
  const label = createElementWithClassName("span", "archive__item-label");
  label.textContent = data.category_name;
  title.textContent = data.title.rendered;
  archiveLink.href = data.link;
  archiveWrapper.appendChild(label).after(title);
  archiveWrapper.appendChild(createArticleDate(data));
  archiveLink.appendChild(createThumbnail(data));
  frag
    .appendChild(archiveItem)
    .appendChild(archiveLink)
    .appendChild(archiveWrapper);
  return frag;
};

const createThumbnail = (data) => {
  const thumbnailUrl = data._embedded["wp:featuredmedia"][0].source_url;
  const thumbnailWrapper = createElementWithClassName(
    "div",
    "archive__item-thumbnail"
  );
  const img = document.createElement("img");
  img.src = thumbnailUrl;
  thumbnailUrl === "" && (img.src = "./img/no-image.jpeg");
  thumbnailWrapper.appendChild(img);
  return thumbnailWrapper;
};

const init = async () => {
  const [postData, categoryData] = await getPostAndCategoryData();
  if (postData && categoryData) {
    renderArchiveList(postData);
    renderCategorySelect(categoryData);
  }
};

const getPostAndCategoryData = async () => {
  const API = {
    post: "https://itosae.com/wp-json/wp/v2/posts?_embed&per_page=5",
    category: "https://itosae.com/wp-json/wp/v2/categories",
  };
  renderLoading(archiveWrapper);
  try {
    return await Promise.all(
      Object.values(API).map((value) => getPostsData(value))
    );
  } catch (error) {
    console.error(error);
  } finally {
    removeLoading();
  }
};

init();

