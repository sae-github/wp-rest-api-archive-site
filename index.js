const archiveWrapper = document.getElementById("js-archive-wrapper");
const archiveBox = document.getElementById("js-archive-box");
const searchField = document.getElementById("js-search-field");
const searchButton = document.getElementById("js-search-button");

let totalPosts;

const endpoint = {
  postApi: "https://itosae.com/wp-json/wp/v2/posts?_embed&context=embed",
  perPage: 5,
  currentPage: 1,
  order: "",
  search: "",
  category: "",
  get url() {
    const postAPI = new URL(this.postApi);
    postAPI.searchParams.set("per_page", this.perPage);
    postAPI.searchParams.set("order", this.order);
    this.search && postAPI.searchParams.set("search", this.search);
    this.category && postAPI.searchParams.set("categories", this.category);
    return postAPI.href;
  }
}

const pageNation = {
  edges: 2,
  get totalPage() {
    return Math.ceil(totalPosts / endpoint.perPage);
  }
}

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
  if (!response.ok) {
    const errorMessage = `${response.status}:${response.statusText}`;
    console.error(errorMessage);
    archiveWrapper.append(createElementWithMessage(errorMessage));
    return;
  }
  return response;
};

const createElementWithMessage = (message) => {
  const element = createElementWithClassName("p", "error-message");
  element.textContent = message;
  return element;
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
  select.addEventListener("change", (event) => {
    endpoint.search = "";
    searchField.value = "";
    searchButton.disabled = true;
    endpoint.currentPage = 1;
    endpoint.category = event.target.selectedOptions[0].dataset.categoryId;
    removePageNationAndArchiveList();
    updateArchiveWrapper(endpoint.url);
  });
}

const getDataFromApi = async (api) => {
  renderLoading(archiveWrapper);
  try {
    return await getJsonData(api);
  } catch (error) {
    archiveWrapper.append(createElementWithMessage(error));
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

const renderArchiveList = (data) => {
  const fragment = document.createDocumentFragment();
  const archiveList = createElementWithClassName("ul", "archive__list");
  archiveList.id = "js-archive-list"
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
    fragment
      .appendChild(archiveItem)
      .appendChild(archiveLink)
      .appendChild(archiveWrapper);
  });
  archiveWrapper.appendChild(archiveList).append(fragment);
}

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
    post: endpoint.url,
    category: "https://itosae.com/wp-json/wp/v2/categories",
  };
  renderLoading(archiveWrapper);
  try {
    return await Promise.all(Object.values(API).map(getJsonData));
  } catch (error) {
    archiveWrapper.append(createElementWithMessage(error));
  } finally {
    removeLoading();
  }
};

const init = async () => {
  const radioButtons = [...document.querySelectorAll(".js-radio-button")];
  endpoint.order = radioButtons.find(button => button.checked).id;
  const data = await getPostAndCategoryData();
  if (!data) return;
  const [postData, categoryData] = data;
  if (postData && categoryData) {
    renderArchiveList(postData);
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
  archiveBox.appendChild(pageNation).appendChild(pageNationList);
}

const createPageNationItems = (start, end) => {
  const frag = document.createDocumentFragment();
  let offset = start * 5;
  for (let i = start; i < end; i++) {
    const pageNationItem = createElementWithClassName("li", "archive__pagenation-item");
    const anchor = createElementWithClassName("a", "archive__pagenation-link");
    anchor.textContent = i + 1;
    const postAPI = new URL(endpoint.url);
    postAPI.searchParams.set("offset", offset);
    anchor.href = postAPI.href;
    offset += endpoint.perPage;
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

const createPageNation = () => {
  const frag = document.createDocumentFragment();
  if (pageNation.totalPage <= pageNation.edges * 2 + 1) {
    frag.appendChild(createPageNationItems(0, pageNation.totalPage));
    return frag;
  }

  if (endpoint.currentPage < pageNation.edges * 2 + 1) {
    frag.appendChild(createPageNationItems(0, pageNation.edges * 2 + 1))
    frag.appendChild(createEllipsis());
    frag.appendChild(createPageNationItems(pageNation.totalPage - 1, pageNation.totalPage));
    return frag;
  }

  if (endpoint.currentPage > pageNation.totalPage - pageNation.edges * 2 + 1) {
    frag.appendChild(createPageNationItems(0, 1));
    frag.appendChild(createEllipsis());
    frag.appendChild(createPageNationItems(pageNation.totalPage - pageNation.edges * 2 - 1, pageNation.totalPage));
    return frag;
  }

  frag.appendChild(createPageNationItems(0, 1));
  frag.appendChild(createEllipsis());
  frag.appendChild(createPageNationItems(endpoint.currentPage - pageNation.edges - 1, Number(endpoint.currentPage) + pageNation.edges));
  frag.appendChild(createEllipsis());
  frag.appendChild(createPageNationItems(pageNation.totalPage - 1, pageNation.totalPage));
  return frag;
}

const addEventListenerForPageNationItem = () => {
  const pageNationItems = [...document.querySelectorAll(".archive__pagenation-link")];
  pageNationItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      endpoint.currentPage = event.target.textContent;
      removePageNationAndArchiveList();
      updateArchiveWrapper(event.target.href);
    });
  });
};

const setPageNation = () => {
  const pageNationList = document.getElementById("js-pagenation-list")
  pageNationList.appendChild(createPageNation());
  toggleSelectedPageNation();
  addEventListenerForPageNationItem();
};

const toggleSelectedPageNation = () => {
  const pageNationItems = [...document.querySelectorAll(".archive__pagenation-link")];
  pageNationItems.forEach((item) => {
    Number(item.textContent) === Number(endpoint.currentPage) &&
      item.parentElement.classList.add("is-selected");
  });
};


const initPageNation = () => {
  if (totalPosts < endpoint.perPage) return;
  renderPageNation();
  setPageNation();
  toggleSelectedPageNation();
}

const radioButtons = [...document.querySelectorAll(".js-radio-button")];
radioButtons.forEach((button) => {
  button.addEventListener("change", (event) => {
    event.preventDefault();
    endpoint.currentPage = 1;
    endpoint.order = event.target.id;
    removePageNationAndArchiveList();
    updateArchiveWrapper(endpoint.url);
  });
});

searchField.addEventListener("change", (event) => {
  const trimmedValue = event.target.value.trim();
  searchButton.disabled = trimmedValue === "";
});

const removePageNationAndArchiveList = () => {
  const pageNation = document.getElementById("js-pagenation");
  pageNation && pageNation.remove();
  archiveWrapper.textContent = "";
}

const updateArchiveWrapper = async (endpoint) => {
  const data = await getDataFromApi(endpoint);
  if (data.length === 0) {
    archiveWrapper.append(createElementWithMessage("対象の記事が見つかりませんでした"));
    return;
  }
  renderArchiveList(data);
  initPageNation();
}

searchButton.addEventListener("click", (event) => {
  event.preventDefault();
  endpoint.category = "";
  endpoint.currentPage = 1;
  endpoint.search = searchField.value.trim();
  document.getElementById("js-category-select").value = "default";
  removePageNationAndArchiveList();
  updateArchiveWrapper(endpoint.url);
});

