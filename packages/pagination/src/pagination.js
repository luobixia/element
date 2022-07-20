import Pager from './pager.vue';
import ElSelect from 'element-ui/packages/select';
import ElOption from 'element-ui/packages/option';
import ElInput from 'element-ui/packages/input';
import Locale from 'element-ui/src/mixins/locale';
import { valueEquals } from 'element-ui/src/utils/util';

export default {
  name: 'ElPagination',

  props: {
    //每页显示条目个数，支持 .sync 修饰符
    pageSize: {
      type: Number,
      default: 10
    },
    //是否使用小型分页样式
    small: Boolean,
    // 总条目数
    total: Number,
   //总页数，total 和 page-count 设置任意一个就可以达到显示页码的功能；如果要支持 page-sizes 的更改，则需要使用 total 属性
    pageCount: Number,
   //页码按钮的数量，当总页数超过该值时会折叠
    pagerCount: {
      type: Number,
      validator(value) {
        return (value | 0) === value && value > 4 && value < 22 && (value % 2) === 1;
      },
      default: 7
    },
    // 当前页数，支持 .sync 修饰符
    currentPage: {
      type: Number,
      default: 1
    },
    //组件布局，子组件名用逗号分隔
    layout: {
      default: 'prev, pager, next, jumper, ->, total'
    },
    //每页显示个数选择器的选项设置
    pageSizes: {
      type: Array,
      default() {
        return [10, 20, 30, 40, 50, 100];
      }
    },
    // 每页显示个数选择器的下拉框类名
    popperClass: String,
    // 替代图标显示的上一页文字
    prevText: String,
    // 替代图标显示的下一页文字
    nextText: String,
    // 是否为分页按钮添加背景色
    background: Boolean,
    // 是否禁用
    disabled: Boolean,
    //只有一页时是否隐藏
    hideOnSinglePage: Boolean
  },

  data() {
    return {
      // 当前的页码
      internalCurrentPage: 1,
      // 总页数 对这个注释保持怀疑态度
      internalPageSize: 0,
      lastEmittedPage: -1,
      userChangePageSize: false
    };
  },
  // render函数生成el-pagination
  render(h) {
    //this.layout就是之前我们在props里面定义的组件布局，如果每页子组件那么就显示null
    const layout = this.layout;
    if (!layout) return null;
    //处理只有一页是否隐藏
    if (this.hideOnSinglePage && (!this.internalPageCount || this.internalPageCount === 1)) return null;

    // 最外层的div template 是一个父容器模板，定义的时候可以先处理它的样式，包括背景以及小样式设定
    let template = <div class={['el-pagination', {
      'is-background': this.background,
      'el-pagination--small': this.small
    }] }></div>;

    //TEMPLATE_MAP 是一个组件集合，里面涉及的组件会在后面定义
    const TEMPLATE_MAP = {
      prev: <prev></prev>,// 上一页
      jumper: <jumper></jumper>,// 跳转 前往多少页
      pager: <pager currentPage={ this.internalCurrentPage } pageCount={ this.internalPageCount } pagerCount={ this.pagerCount } on-change={ this.handleCurrentChange } disabled={ this.disabled }></pager>,
      next: <next></next>,// 下一页
      sizes: <sizes pageSizes={ this.pageSizes }></sizes>,// 每页显示条目个数
      slot: <slot>{ this.$slots.default ? this.$slots.default : '' }</slot>,
      total: <total></total>// 总共的页数
    };
    const components = layout.split(',').map((item) => item.trim());
    const rightWrapper = <div class="el-pagination__rightwrapper"></div>;
    let haveRightWrapper = false;

    template.children = template.children || [];
    rightWrapper.children = rightWrapper.children || [];
    //  // ->这个符号主要是将其后面的组件放在rightWrapper中，然后右浮动；如果存在->符号，就将haveRightWrapper为true
    components.forEach(compo => {
      if (compo === '->') {
        haveRightWrapper = true;
        return;
      }

      // 当haveRightWrapper为true,即在->后面的放入rightWrapper中
      if (!haveRightWrapper) {
        template.children.push(TEMPLATE_MAP[compo]);
      } else {
        rightWrapper.children.push(TEMPLATE_MAP[compo]);
      }
    });

    if (haveRightWrapper) {
      template.children.unshift(rightWrapper);
    }

    return template;
  },

  components: {
    Prev: {
      // 上一页组件 就是点击'上一页'或者前进按钮 (以及边界处理)  prevText用户设置的替代上一页图标的文字，存在显示文字，不存在显示上一页图标
      render(h) {
        return (
          <button
            type="button"
            class="btn-prev"
            disabled={ this.$parent.disabled || this.$parent.internalCurrentPage <= 1 }
            on-click={ this.$parent.prev }>
            {
              this.$parent.prevText
                ? <span>{ this.$parent.prevText }</span>
                : <i class="el-icon el-icon-arrow-left"></i>
            }
          </button>
        );
      }
    },
   // 下一页组件 当前页数等于总页数时 或者 总页数等于0时，下一页按钮被禁用
    Next: {
      render(h) {
        return (
          <button
            type="button"
            class="btn-next"
            disabled={ this.$parent.disabled || this.$parent.internalCurrentPage === this.$parent.internalPageCount || this.$parent.internalPageCount === 0 }
            on-click={ this.$parent.next }>
            {
              this.$parent.nextText
                ? <span>{ this.$parent.nextText }</span>
                : <i class="el-icon el-icon-arrow-right"></i>
            }
          </button>
        );
      }
    },
  // 每页显示条目个数组件
    Sizes: {
      mixins: [Locale],

      props: { 
        pageSizes: Array  // 每页显示个数选择器的选项设置   [10, 20, 30, 40, 50 ]
      },

      watch: {
        // 声明了之后会立马执行handler里面的函数
        pageSizes: {
          immediate: true,
          handler(newVal, oldVal) {
            if (valueEquals(newVal, oldVal)) return;
            // 如果用户设置了每页显示的条目个数，并且pageSize在设置的pageSizes中存在的话，就显示pageSize，否则就显示this.pageSizes[0]
            // 最后将每页显示的条目个数赋值给this.$parent.internalPageSize
            if (Array.isArray(newVal)) {
              this.$parent.internalPageSize = newVal.indexOf(this.$parent.pageSize) > -1
                ? this.$parent.pageSize
                : this.pageSizes[0];
            }
          }
        }
      },

      render(h) {
        return (// 渲染出每页可选的分页数   this.t('el.pagination.pagesize') 返回'条/页'
          <span class="el-pagination__sizes">
            <el-select
              value={ this.$parent.internalPageSize }
              popperClass={ this.$parent.popperClass || '' }
              size="mini"
              on-input={ this.handleChange }
              disabled={ this.$parent.disabled }>
              {
                this.pageSizes.map(item =>
                  <el-option
                    value={ item }
                    label={ item + this.t('el.pagination.pagesize') }>
                  </el-option>
                )
              }
            </el-select>
          </span>
        );
      },

      components: {
        ElSelect,
        ElOption
      },

      methods: {
        handleChange(val) {
          if (val !== this.$parent.internalPageSize) {
            this.$parent.internalPageSize = val = parseInt(val, 10);
            this.$parent.userChangePageSize = true;
            //如果父组件中pageSize用了.sync 修饰符，这里将会触发父组件的update，改变pageSize的值
            this.$parent.$emit('update:pageSize', val);
            //触发父组件的size-change事件，将改变的每页显示的条目个数的值传递出去
            this.$parent.$emit('size-change', val);
          }
        }
      }
    },
    // 前往多少页组件
    Jumper: {
      mixins: [Locale],

      components: { ElInput },

      data() {
        return {
          userInput: null
        };
      },

      watch: {
        '$parent.internalCurrentPage'() {
          this.userInput = null;
        }
      },

      methods: {
        // 按下回车，前往多少页
        handleKeyup({ keyCode, target }) {
          // Chrome, Safari, Firefox triggers change event on Enter
          // Hack for IE: https://github.com/ElemeFE/element/issues/11710
          // Drop this method when we no longer supports IE
          if (keyCode === 13) {
            this.handleChange(target.value);
          }
        },
        handleInput(value) {
          this.userInput = value;
        },
        // 改变当前页
        handleChange(value) {
          // 更新页码列表中当前页的值
          this.$parent.internalCurrentPage = this.$parent.getValidCurrentPage(value);
          this.$parent.emitChange();
          this.userInput = null;
        }
      },
      // 前往多少页
      render(h) {
        return (
          <span class="el-pagination__jump">
            { this.t('el.pagination.goto') }
            <el-input
              class="el-pagination__editor is-in-pagination"
              min={ 1 }
              max={ this.$parent.internalPageCount }
              value={ this.userInput !== null ? this.userInput : this.$parent.internalCurrentPage }
              type="number"
              disabled={ this.$parent.disabled }
              nativeOnKeyup={ this.handleKeyup }
              onInput={ this.handleInput }
              onChange={ this.handleChange }/>
            { this.t('el.pagination.pageClassifier') }
          </span>
        );
      }
    },
    // 总共的页数，组件
    Total: {
      mixins: [Locale],

      render(h) {
        return (
          typeof this.$parent.total === 'number'
            ? <span class="el-pagination__total">{ this.t('el.pagination.total', { total: this.$parent.total }) }</span>
            : ''
        );
      }
    },

    Pager
  },

  methods: {
    handleCurrentChange(val) {
      this.internalCurrentPage = this.getValidCurrentPage(val);
      this.userChangePageSize = true;
      // 触发父组件current-change事件，并传递相应的值
      this.emitChange();
    },

    prev() {
      if (this.disabled) return;
      const newVal = this.internalCurrentPage - 1;
      this.internalCurrentPage = this.getValidCurrentPage(newVal);
      // 用户点击上一页按钮改变当前页后触发    当前页
      // 触发父组件的prev-click事件，并将CurrentPage传递出去
      this.$emit('prev-click', this.internalCurrentPage);
      // 触发父组件current-change事件，并传递相应的值
      this.emitChange();
    },

    next() {
      if (this.disabled) return;
      const newVal = this.internalCurrentPage + 1;
      this.internalCurrentPage = this.getValidCurrentPage(newVal);
      // 用户点击下一页按钮改变当前页后触发    当前页
      // 触发父组件的next-click事件，并将CurrentPage传递出去
      this.$emit('next-click', this.internalCurrentPage);
      this.emitChange();
    },
    // 校验需要前往的页码的值
    getValidCurrentPage(value) {
      value = parseInt(value, 10);

      const havePageCount = typeof this.internalPageCount === 'number';

      let resetValue;
      if (!havePageCount) {
        if (isNaN(value) || value < 1) resetValue = 1;
      } else {
        // 如果当前页码小于1，则取1；如果当前页码大于最大页码，则取最大页码
        if (value < 1) {
          resetValue = 1;
        } else if (value > this.internalPageCount) {
          resetValue = this.internalPageCount;
        }
      }
      // 如果当前页码是非数字，或者为0，则将当前页码置为1，并返回
      if (resetValue === undefined && isNaN(value)) {
        resetValue = 1;
      } else if (resetValue === 0) {
        resetValue = 1;
      }

      return resetValue === undefined ? value : resetValue;
    },

    emitChange() {
      this.$nextTick(() => {
        // 用户改变当前PageSize时，触发父组件的current-change事件
        if (this.internalCurrentPage !== this.lastEmittedPage || this.userChangePageSize) {
          // currentPage 改变时会触发    当前页
          this.$emit('current-change', this.internalCurrentPage);
          // 当前页赋值给上次点击的页面
          // lastEmittedPage记录最后传递的CurrentPage的值
          this.lastEmittedPage = this.internalCurrentPage;
          this.userChangePageSize = false;
        }
      });
    }
  },

  computed: {
    // 总页码
    internalPageCount() {
      if (typeof this.total === 'number') {
        // 总页数 = 总条目数 / 每页的显示条数
        return Math.max(1, Math.ceil(this.total / this.internalPageSize));
      } else if (typeof this.pageCount === 'number') {
        // 总页数
        return Math.max(1, this.pageCount);
      }
      return null;
    }
  },

  watch: {
    currentPage: {
      immediate: true,
      handler(val) {
        this.internalCurrentPage = this.getValidCurrentPage(val);
      }
    },

    pageSize: {
      immediate: true,
      handler(val) {
        this.internalPageSize = isNaN(val) ? 10 : val;
      }
    },
    // internalCurrentPage改变时去触发父组件中currentPage更新
    internalCurrentPage: {
      immediate: true,
      handler(newVal) {
        this.$emit('update:currentPage', newVal);
        this.lastEmittedPage = -1;
      }
    },
    // 总页码
    internalPageCount(newVal) {
      /* istanbul ignore if */
      const oldPage = this.internalCurrentPage;
      if (newVal > 0 && oldPage === 0) {
        this.internalCurrentPage = 1;
      } else if (oldPage > newVal) {
        this.internalCurrentPage = newVal === 0 ? 1 : newVal;
        this.userChangePageSize && this.emitChange();
      }
      this.userChangePageSize = false;
    }
  }
};
