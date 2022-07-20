<template>
  <ul @click="onPagerClick" class="el-pager">
    <li
      :class="{ active: currentPage === 1, disabled }"
      v-if="pageCount > 0"
      class="number">1</li>
      <!-- 第一页 -->
      <!-- 如果当前页数为1，那么样式为显蓝色，且按钮为禁用 -->
      <!-- 总页数大于0的时候才会显示哦 -->
    <li
      class="el-icon more btn-quickprev"
      :class="[quickprevIconClass, { disabled }]"
      v-if="showPrevMore"
      @mouseenter="onMouseenter('left')"
      @mouseleave="quickprevIconClass = 'el-icon-more'">
      <!-- 显示向左更多 没有移上去就是...，移上去就是一个向左的图标 -->
      <!-- quickprevIconClass ...的图标 -->
      <!-- showPrevMore 这个为真的时候才显示，因为有时候页数没达到那么多，...就不会显示，因此下面需要判断 -->
      <!-- 两个移入移除的操作就是样式改变了 -->
    </li>
    <li
      v-for="pager in pagers"
      :key="pager"
      :class="{ active: currentPage === pager, disabled }"
      class="number">{{ pager }}</li>
    <!-- 控制要显示哪些页数 - 页码 -->
    <!-- pager是一个计算属性 -->
    <li
      class="el-icon more btn-quicknext"
      :class="[quicknextIconClass, { disabled }]"
      v-if="showNextMore"
      @mouseenter="onMouseenter('right')"
      @mouseleave="quicknextIconClass = 'el-icon-more'">
      <!-- 向右更多 没有移上去就是...，移上去就是一个向右的图标 -->
    </li>
    <li
      :class="{ active: currentPage === pageCount, disabled }"
      class="number"
      v-if="pageCount > 1">{{ pageCount }}</li>
      <!-- 总页数 -->
  </ul>
</template>

<script type="text/babel">
  export default {
    name: 'ElPager',

    props: {
      // 当前页数，支持 .sync 修饰符
      currentPage: Number,
      // 总页数，total 和 page-count 设置任意一个就可以达到显示页码的功能；如果要支持 page-sizes 的更改，则需要使用 total 属性
      pageCount: Number,
      // 页码按钮的数量，当总页数超过该值时会折叠    大于等于 5 且小于等于 21 的奇数    7
      pagerCount: Number,
      // 是否禁用
      disabled: Boolean
    },

    watch: {
      // 是否显示<<     el-icon-more对应的是...的字体图标
      showPrevMore(val) {
        if (!val) this.quickprevIconClass = 'el-icon-more';
      },
      // 是否显示>>
      showNextMore(val) {
        if (!val) this.quicknextIconClass = 'el-icon-more';
      }
    },

    methods: {
      // 方法被绑定在ul上，而不是li标签上，使用到的是事件代理模式
      onPagerClick(event) {
        const target = event.target;
        if (target.tagName === 'UL' || this.disabled) {
          return;
        }
        // 找到点击对象的内容
        let newPage = Number(event.target.textContent);
        // 带有数字的按钮数
        const pageCount = this.pageCount;
        const currentPage = this.currentPage;
        // 每次移动的距离
        const pagerCountOffset = this.pagerCount - 2;
        // 点击...
        if (target.className.indexOf('more') !== -1) {
          // 点击<<
          if (target.className.indexOf('quickprev') !== -1) {
            newPage = currentPage - pagerCountOffset;
            // 点击>>
          } else if (target.className.indexOf('quicknext') !== -1) {
            newPage = currentPage + pagerCountOffset;
          }
        }

        /* istanbul ignore if */
        if (!isNaN(newPage)) {
          // 最小为1
          if (newPage < 1) {
            newPage = 1;
          }
          // 最大为pageCount
          if (newPage > pageCount) {
            newPage = pageCount;
          }
        }
        // 新旧值不相等
        if (newPage !== currentPage) {
          this.$emit('change', newPage);
        }
      },
      // 鼠标移入
      onMouseenter(direction) {
        if (this.disabled) return;
        if (direction === 'left') {
          // 设置<<类名
          this.quickprevIconClass = 'el-icon-d-arrow-left';
        } else {
          // 设置>>类名
          this.quicknextIconClass = 'el-icon-d-arrow-right';
        }
      }
    },

    computed: {
      // example < 1 ... 3 4 5 6 7 8 9 10 11 ... 50 >  currentPage  = 7
      pagers() {
        const pagerCount = this.pagerCount;  //  11 猜测一共显示11个数字，不包括...以及上下一页
        const halfPagerCount = (pagerCount - 1) / 2;

        const currentPage = Number(this.currentPage);
        // 总页数
        const pageCount = Number(this.pageCount);

        let showPrevMore = false;
        let showNextMore = false;

        // 判断是否有more
        if (pageCount > pagerCount) {// 50 > 11
          if (currentPage > pagerCount - halfPagerCount) {
            // 7 > 11 - 5
            showPrevMore = true;
          }

          if (currentPage < pageCount - halfPagerCount) {
            // 7 < 50 - 5
            showNextMore = true;
          }
        }

        const array = [];

         // 如果有more的话，具体是四种情况的哪一种
        if (showPrevMore && !showNextMore) {
          //  41 = 50 - (11 - 2)
          const startPage = pageCount - (pagerCount - 2);
          // pageCount 50
          for (let i = startPage; i < pageCount; i++) {
            array.push(i);
          }
        } else if (!showPrevMore && showNextMore) {
          for (let i = 2; i < pagerCount; i++) {
            array.push(i);
          }
        } else if (showPrevMore && showNextMore) {
          // offset 4
          const offset = Math.floor(pagerCount / 2) - 1;
          // for (let i = 3;i <= 11;i++)
          for (let i = currentPage - offset ; i <= currentPage + offset; i++) {
            array.push(i);
          }
        } else {
          for (let i = 2; i < pageCount; i++) {
            array.push(i);
          }
        }

        this.showPrevMore = showPrevMore;
        this.showNextMore = showNextMore;

        return array;
      }
    },

    data() {
      return {
        current: null,
        showPrevMore: false,
        showNextMore: false,
        quicknextIconClass: 'el-icon-more',
        quickprevIconClass: 'el-icon-more'
      };
    }
  };
</script>
