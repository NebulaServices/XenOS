document.querySelector('.os-battery-container').innerHTML = `	
<svg
  class="os-header-items os-battery"
  xmlns="http://www.w3.org/2000/svg"
  width="447"
  height="112"
  viewBox="0 0 447 112"
  fill="none"
>
  <rect
    x="243.5"
    y="39.5"
    width="18"
    height="34"
    rx="6.5"
    stroke="#F0F0F0"
    stroke-width="5"
  />
  <rect
    x="4"
    y="4"
    width="239"
    height="104"
    rx="26"
    stroke="white"
    stroke-width="8"
  />
  <rect
    id="os-battery-bar"
    x="15"
    y="17"
    rx="16"
    fill="white"
  />
</svg>`

document.querySelector('.os-header-items-wrap').insertAdjacentHTML('afterbegin', `
<svg
  style="width: 26px; height: 27px; margin-right: 6px"
  xmlns="http://www.w3.org/2000/svg"
  width="295"
  height="295"
  viewBox="0 0 295 295"
  fill="none"
  onclick="xen.browserTool.fullscreen()"
>
  <g filter="url(#filter0_di_15_14)">
    <rect
      x="4"
      width="287"
      height="287"
      rx="143.5"
      fill="white"
    />
    <g filter="url(#filter1_d_15_14)">
      <path
        d="M56.8841 190V96.1818H107.275V99.1136H59.8159V141.625H102.877V144.557H59.8159V190H56.8841ZM164.491 119.636C164.033 113.223 161.575 107.955 157.116 103.832C152.688 99.7092 146.839 97.6477 139.571 97.6477C134.807 97.6477 130.547 98.5639 126.79 100.396C123.034 102.229 120.071 104.748 117.903 107.955C115.735 111.131 114.651 114.781 114.651 118.903C114.651 121.286 115.048 123.484 115.842 125.5C116.636 127.516 117.842 129.363 119.461 131.043C121.11 132.692 123.171 134.189 125.645 135.532C128.149 136.846 131.081 138.021 134.44 139.06L145.068 142.358C149.13 143.61 152.642 145.015 155.604 146.572C158.567 148.13 161.01 149.886 162.934 151.841C164.888 153.765 166.339 155.918 167.286 158.3C168.233 160.651 168.706 163.278 168.706 166.179C168.706 171.065 167.454 175.417 164.95 179.235C162.445 183.052 158.949 186.045 154.459 188.213C149.97 190.382 144.763 191.466 138.838 191.466C133.127 191.466 128.134 190.473 123.858 188.488C119.583 186.473 116.193 183.709 113.689 180.197C111.215 176.654 109.825 172.592 109.52 168.011H112.452C112.757 172.043 114.025 175.6 116.254 178.685C118.483 181.77 121.507 184.182 125.324 185.923C129.172 187.664 133.677 188.534 138.838 188.534C144.213 188.534 148.916 187.603 152.947 185.74C157.009 183.846 160.155 181.22 162.384 177.86C164.644 174.501 165.774 170.607 165.774 166.179C165.774 162.82 165.041 159.873 163.575 157.338C162.109 154.772 159.804 152.512 156.658 150.558C153.512 148.603 149.405 146.847 144.335 145.29L133.707 141.991C126.347 139.67 120.835 136.601 117.17 132.784C113.536 128.966 111.719 124.339 111.719 118.903C111.719 114.292 112.925 110.169 115.338 106.535C117.75 102.87 121.049 99.984 125.233 97.8768C129.447 95.7695 134.227 94.7159 139.571 94.7159C144.946 94.7159 149.664 95.7848 153.726 97.9226C157.788 100.06 161.01 103.007 163.392 106.764C165.774 110.52 167.118 114.811 167.423 119.636H164.491ZM244.659 125.5H241.544C240.964 122.385 239.834 119.209 238.154 115.972C236.474 112.734 234.245 109.741 231.466 106.993C228.687 104.244 225.404 102.03 221.617 100.35C217.83 98.6708 213.539 97.831 208.744 97.831C202.331 97.831 196.391 99.587 190.924 103.099C185.488 106.581 181.106 111.696 177.777 118.445C174.478 125.164 172.829 133.379 172.829 143.091C172.829 152.925 174.478 161.201 177.777 167.92C181.106 174.638 185.488 179.723 190.924 183.174C196.391 186.625 202.331 188.351 208.744 188.351C213.539 188.351 217.83 187.526 221.617 185.877C225.404 184.197 228.687 181.999 231.466 179.281C234.245 176.532 236.474 173.539 238.154 170.302C239.834 167.034 240.964 163.827 241.544 160.682H244.659C244.079 163.98 242.918 167.416 241.177 170.989C239.437 174.532 237.085 177.845 234.123 180.93C231.16 184.014 227.572 186.518 223.357 188.442C219.143 190.336 214.272 191.283 208.744 191.283C201.048 191.283 194.283 189.267 188.45 185.236C182.617 181.205 178.067 175.57 174.799 168.332C171.531 161.094 169.897 152.68 169.897 143.091C169.897 133.501 171.531 125.088 174.799 117.85C178.067 110.612 182.617 104.977 188.45 100.946C194.283 96.9148 201.048 94.8991 208.744 94.8991C214.272 94.8991 219.143 95.8459 223.357 97.7393C227.572 99.6328 231.16 102.122 234.123 105.206C237.085 108.26 239.437 111.574 241.177 115.147C242.918 118.69 244.079 122.141 244.659 125.5Z"
        fill="black"
      />
    </g>
  </g>
  <defs>
    <filter
      id="filter0_di_15_14"
      x="0"
      y="0"
      width="295"
      height="295"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood
        flood-opacity="0"
        result="BackgroundImageFix"
      />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_15_14"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_15_14"
        result="shape"
      />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2.5" />
      <feComposite
        in2="hardAlpha"
        operator="arithmetic"
        k2="-1"
        k3="1"
      />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.57 0"
      />
      <feBlend
        mode="normal"
        in2="shape"
        result="effect2_innerShadow_15_14"
      />
    </filter>
    <filter
      id="filter1_d_15_14"
      x="42.8842"
      y="89.7159"
      width="207.775"
      height="116.75"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood
        flood-opacity="0"
        result="BackgroundImageFix"
      />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dx="-4" dy="5" />
      <feGaussianBlur stdDeviation="5" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0"
      />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow_15_14"
      />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_15_14"
        result="shape"
      />
    </filter>
  </defs>
</svg>`)