const archiveWrapper = document.getElementById("js-archive-wrapper");
const archiveList = document.getElementById("js-archive-list");
let totalPosts;
let totalPage;
let edges = 2;
let currentPage = 1;
let perPage = 5;
let categoryId;
const postApi = "https://itosae.com/wp-json/wp/v2/posts?_embed";

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

const getFetchResponseOrError = async (api) => {
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

const getJsonData = async (api) => {
  const response = await getFetchResponseOrError(api);
  totalPosts = getTotalPosts(response);
  return await response.json();
};

const renderCategorySelect = (data) => {
  const selectWrapper = document.getElementById("js-archive-select-wrapper");
  const select = document.createElement("select");
  select.id = "js-category-select";
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
    option.value = d.slug;
    option.dataset.categoryId = d.id;
    option.textContent = d.name;
    frag.appendChild(option);
  });
  return frag;
};

const addEventListenerForCategorySelect = () => {
  const select = document.getElementById("js-category-select");
  select.addEventListener("change", async (event) => {
    archiveList.textContent = "";
    const pageNation = document.getElementById("js-pagenation");
    pageNation && pageNation.remove();
    const selectedCategoryData = await getSelectedCategoryData(setSelectedCategoryEndpoint(event.target));
    if (selectedCategoryData.length === 0) {
      archiveList.textContent = "選択されたカテゴリーの記事がありません";
      return;
    }
    archiveList.appendChild(createArticleItems(selectedCategoryData));
    initPageNation();
  });
}

const setSelectedCategoryEndpoint = (target) => {
  const postAPI = new URL(postApi);
  postAPI.searchParams.set("per_page", perPage);
  categoryId = target.selectedOptions[0].dataset.categoryId;
  categoryId && postAPI.searchParams.set("categories", categoryId);
  return postAPI.href;
}

const getSelectedCategoryData = async (api) => {
  renderLoading(archiveWrapper);
  try {
    return await getJsonData(api);
  } catch (error) {
    renderErrorMessage(error, archiveWrapper);
  } finally {
    removeLoading();
  }
}

const createArticleDate = (data) => {
  const date = createElementWithClassName("p", "archive__item-date");
  const time = document.createElement("time");
  const format = new Date(data.date);
  date.textContent = `${format.getFullYear()}.${format.getMonth()}.${format.getDate()}`;
  date.appendChild(time);
  return date;
};

const createArticleItems = (data) => {
  const frag = document.createDocumentFragment();
  data.forEach((d) => {
    const archiveItem = createElementWithClassName("li", "archive__item");
    const archiveLink = createElementWithClassName("a", "archive__item-link");
    const archiveWrapper = createElementWithClassName("div", "archive__item-text");
    const title = createElementWithClassName("p", "archive__item-title");
    const label = createElementWithClassName("span", "archive__item-label");
    label.textContent = d.category_name;
    title.textContent = d.title.rendered;
    archiveLink.href = d.link;
    archiveWrapper.appendChild(label).after(title);
    archiveWrapper.appendChild(createArticleDate(d));
    archiveLink.appendChild(createThumbnail(d));
    frag
      .appendChild(archiveItem)
      .appendChild(archiveLink)
      .appendChild(archiveWrapper);
  })
  return frag;
};

const createThumbnail = (data) => {
  const thumbnailUrl = data._embedded["wp:featuredmedia"][0].source_url;
  const thumbnailWrapper = createElementWithClassName("div", "archive__item-thumbnail");
  const img = document.createElement("img");
  img.src = thumbnailUrl;
  thumbnailUrl === "" && (img.src = "./img/no-image.jpeg");
  thumbnailWrapper.appendChild(img);
  return thumbnailWrapper;
};

const getPostAndCategoryData = async () => {
  const API = {
    post: `${postApi}&per_page=${perPage}`,
    category: "https://itosae.com/wp-json/wp/v2/categories",
  };
  renderLoading(archiveWrapper);
  try {
    return await Promise.all(Object.values(API).map(getJsonData));
  } catch (error) {
    renderErrorMessage(error, archiveWrapper);
  } finally {
    removeLoading();
  }
};

const init = async () => {
  const [postData, categoryData] = await getPostAndCategoryData();
  if (postData && categoryData) {
    archiveList.appendChild(createArticleItems(postData));
    renderCategorySelect(categoryData);
    addEventListenerForCategorySelect();
    initPageNation();
  }
};

init();

const renderPageNation = () => {
  const pageNation = createElementWithClassName("div", "archive__pagenation");
  const pageNationList = createElementWithClassName("ul", "archive__pagenation-list");
  pageNation.id = "js-pagenation";
  pageNationList.id = "js-pagenation-list";
  archiveWrapper.appendChild(pageNation).appendChild(pageNationList);
}

const createPageNationItems = (start, end) => {
  const frag = document.createDocumentFragment();
  let offset = start * 5;
  for (let i = start; i < end; i++) {
    const pageNationItem = createElementWithClassName("li", "archive__pagenation-item");
    const anchor = createElementWithClassName("a", "archive__pagenation-link");
    anchor.textContent = i + 1;
    const postAPI = new URL(postApi);
    postAPI.searchParams.set("per_page", perPage);
    postAPI.searchParams.set("offset", offset);
    categoryId && postAPI.searchParams.set("categories", categoryId);
    anchor.href = postAPI.href;
    offset += perPage;
    frag.appendChild(pageNationItem).appendChild(anchor);
  }
  return frag;
};

const createEllipsis = () => {
  const ellipsis = createElementWithClassName("li", "archive__pagenation-item");
  ellipsis.textContent = "...";
  ellipsis.style.pointerEvents = "none";
  return ellipsis;
}

const createLastPageNation = () => {
  const frag = document.createDocumentFragment();
  const pageNationItem = createElementWithClassName("li", "archive__pagenation-item");
  const anchor = createElementWithClassName("a", "archive__pagenation-link");
  pageNationItem.appendChild(anchor);
  anchor.textContent = totalPage;
  anchor.href = `https://itosae.com/wp-json/wp/v2/posts?_embed&per_page=5&offset=${perPage * (totalPage - 1)}`;
  frag.appendChild(createEllipsis()).after(pageNationItem);
  return frag;
};

const createFirstPageNation = () => {
  const frag = document.createDocumentFragment();
  const pageNationItem = createElementWithClassName("li", "archive__pagenation-item");
  const anchor = createElementWithClassName("a", "archive__pagenation-link");
  pageNationItem.appendChild(anchor);
  anchor.textContent = 1;
  anchor.href = `https://itosae.com/wp-json/wp/v2/posts?_embed&per_page=5&offset=0`;
  frag.appendChild(pageNationItem).after(createEllipsis());
  return frag;
};

const createPageNation = () => {
  const frag = document.createDocumentFragment();
  if (totalPage <= edges * 2 + 1) {
    frag.appendChild(createPageNationItems(0, totalPage));
    return frag;
  }

  if (currentPage < edges * 2 + 1) {
    frag.appendChild(createPageNationItems(0, edges * 2 + 1))
    frag.appendChild(createLastPageNation());
    return frag;
  }

  if (currentPage > totalPage - edges * 2 + 1) {
    frag.appendChild(createFirstPageNation())
    frag.appendChild(createPageNationItems(totalPage - edges * 2 - 1, totalPage));
    return frag;
  }

  frag.appendChild(createFirstPageNation());
  frag.appendChild(createPageNationItems(totalPage - edges * 2 - 2, totalPage - 1))
  frag.appendChild(createLastPageNation());
  return frag;
}

const addEventListenerForPageNationItem = () => {
  const pageNationItems = [...document.querySelectorAll(".archive__pagenation-link")];
  pageNationItems.forEach((item) => {
    item.addEventListener("click", async (event) => {
      event.preventDefault();
      currentPage = event.target.textContent;
      const archiveList = document.getElementById("js-archive-list");
      const pageNation = document.getElementById("js-pagenation-list");
      archiveList.textContent = "";
      pageNation.textContent = "";
      const data = await getSelectedCategoryData(event.target.href, archiveList);
      archiveList.appendChild(createArticleItems(data));
      setPageNation();
    });
  });
};

const setPageNation = () => {
  const pageNationLList = document.getElementById("js-pagenation-list")
  pageNationLList.textContent = "";
  pageNationLList.appendChild(createPageNation());
  toggleSelectedPageNation();
  addEventListenerForPageNationItem();
};

const toggleSelectedPageNation = () => {
  const pageNationItems = [...document.querySelectorAll(".archive__pagenation-link")];
  pageNationItems.forEach((item) => {
    Number(item.textContent) === Number(currentPage) &&
      item.parentElement.classList.add("is-selected");
  });
};

const initPageNation = () => {
  if (totalPosts < perPage) return;
  totalPage = Math.ceil(totalPosts / perPage);
  currentPage = 1;
  renderPageNation();
  setPageNation();
}
