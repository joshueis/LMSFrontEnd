var lmsApp = angular.module('lmsApp', []);
var servDomain = "http://gcitlms.ddns.net:8090/";
//var servDomain = "http://localhost:8090/";

lmsApp.controller('libController', function($scope, $http) {

	lc = this;
	lc.libBranches;// list of branches
	lc.books;// list of books in branch
	lc.sBranch;// selected branch
	lc.sBook;// selected branch book

	lc.getLibBranches = function() {
		lc.libBranches = [];
		$http({
			method : "get",
			url : servDomain + "branches",
		}).then(function(success) {
			lc.libBranches = success.data;
		});
	}

	lc.getBooks = function() {
		lc.books = [];
		$http({
			method : "get",
			url : servDomain + "branches/" + lc.sBranch.branchId + "/branchBooks",
		}).then(function(success) {
			var len = success.data.length;
			for (var i = 0; i < len; i++) {
				var temp = {};
				temp.title = success.data[i].title;
				temp.bookId = success.data[i].bookId;
				temp.branchId = success.data[i].branchId;
				temp.noOfCopies = success.data[i].noOfCopies;
				temp.minVal = success.data[i].noOfCopies;
				lc.books.push(temp);
			}
			lc.sBook = lc.books[0];
		});
	}

	lc.modCopies = function(op) {
		if (op == "plus") {
			$('#mButt').attr('disabled', false);
			lc.sBook.noOfCopies++;
		} else if (op == "minus") {
			if ($('#copies').val() - 1 == $('#copies').attr('min')) {
				lc.sBook.noOfCopies--;
				$('#mButt').attr('disabled', true);
			} else
				lc.sBook.noOfCopies--;
		} else {
			$('#mButt').attr('disabled', true);
			lc.sBook.minVal = lc.sBook.noOfCopies;
		}

		// post value to server
		$http({
			method : "put",
			url : servDomain + "branches/" + lc.sBranch.branchId + "/branchBooks/"+lc.sBook.bookId,
			data : {noOfCopies: lc.sBook.noOfCopies}
		});
	}

	// x-editable code
	lc.xEd = function() {
		$('#brName').editable({
			type : 'text',
			value : lc.sBranch.branchName,
			placement : 'right',
			validate : function(value) {
				if ($.trim(value) == '') {
					return 'This field is required';
				} else if ($.trim(value).length < 3) {
					return 'Name must be at least 3 characters';
				}
			},
			url: servDomain +"branches/"+lc.sBranch.branchId,
			pk: lc.sBranch.branchId,
			ajaxOptions: {
				type: 'put',
				contentType: 'application/json', 
			},
			params: function(params) {
				var data = jQuery.extend(true,{}, lc.sBranch);
				delete data.branchId;
				data.branchName = params.value;
				return angular.toJson(data); 
			}
		});

		$('#brAddr').editable({
			type : 'text',
			value : lc.sBranch.branchAddress,
			placement : 'right',
			validate : function(value) {
				if ($.trim(value) == '') {
					return 'This field is required';
				} else if ($.trim(value).length < 10) {
					return 'Address must be at least 10 characters';
				}
			},
			url: servDomain +"branches/"+lc.sBranch.branchId,
			pk : lc.sBranch.branchId,
			ajaxOptions: {
				type: 'put',
				contentType: 'application/json', 
			},
			params: function(params) {
				var data = jQuery.extend(true,{}, lc.sBranch);
				delete data.branchId;
				data.branchAddress = params.value;
				return angular.toJson(data); 
			}
		});
	}
});

lmsApp.controller('borController', function($scope, $http) {
	bc = this;

	bc.borrower;// borrower card number
	bc.loans;// current loans in account
	bc.libBranches;// list of branches
	bc.books;// books in branch
	bc.sBranch;// selected checkout branch
	bc.sBook;// selected checkout book

	bc.valCardNo = function() {
		var input = document.getElementById("cardNo");
		if (input.value == "")
			input.setCustomValidity("Invalid Card Number");
		else if (input.checkValidity()) {
			$http({
				method : "GET",
				url: servDomain + "borrowers/"+bc.borrower.cardNo,
			}).then(function(success) {
				bc.borrower.name = success.data.name;
				bc.currentTab = 2.1;
			}, function(error){
				if (error.status == 404)
					input.setCustomValidity("Invalid Card Number");
			});
		}
	}

	bc.setValid = function() {
		var input = document.getElementById("cardNo");
		input.setCustomValidity("");
	}

	bc.getLoans = function() {
		bc.loans = [];
		$http({
			method : "get",
			url : servDomain + "loans?cardNo=" + bc.borrower.cardNo,
		}).then(function(success) {
			bc.loans = success.data;
		});
	}

	bc.bookReturn = function(idx) {
		var url = servDomain + "loans/" + bc.borrower.cardNo + "/" + bc.loans[idx].branch.branchId  + "/" +  bc.loans[idx].book.bookId + "/" + bc.loans[idx].dateOut;
		$http({
			method : "put",
			url : url,
			data: {
				dueDate: bc.loans[idx].dueDate,
				dateIn: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
			}
		}).then(function(success) {
			bc.sBook = jQuery.extend(true,{}, bc.loans[idx].book);
			bc.sBranch = jQuery.extend(true,{}, bc.loans[idx].branch);
			bc.modCopies('plus');
			bc.loans.splice(idx, 1);
		});
	}

	bc.getLibBranches = function() {
		bc.libBranches = [];
		$http({
			method : "get",
			url : servDomain + "branches",
		}).then(function(success) {
			bc.libBranches = success.data;
		});
	}

	bc.getBooks = function() {
		bc.books = [];
		$http({
			method : "get",
			url : servDomain + "branches/"+bc.sBranch.branchId + "/branchBooks?isAv=true"
		}).then(function(success) {
			bc.books = success.data;
		});
	}

	bc.bookCheckout = function() {
		$http({
			method : "post",
			url : servDomain + "loans",
			data : {
				branch: {branchId : bc.sBranch.branchId},
				book:{bookId : bc.sBook.bookId},
				borrower:{cardNo : bc.borrower.cardNo},
				dateOut: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
				dueDate: moment(new Date()).add(7,'days').format("YYYY-MM-DD HH:mm:ss")
			}
		}).then(function(success) {
			bc.modCopies('minus');
		});
	}

	bc.modCopies = function(op) {
		if (op == "plus") {
			bc.sBook.noOfCopies++;
		} else if (op == "minus") {
			bc.sBook.noOfCopies--;
		}
		// post value to server
		$http({
			method : "put",
			url : servDomain + "branches/" + bc.sBranch.branchId + "/branchBooks/"+bc.sBook.bookId,
			data : {noOfCopies: bc.sBook.noOfCopies}
		});
	}

});

lmsApp.controller('adminController', function($scope, $http) {
	ac = this;

	ac.bookElements = bookElements;
	ac.authorElements = authorElements;
	ac.publisherElements = publisherElements;
	ac.branchElements = branchElements;
	ac.borrowerElements = borrowerElements;

	ac.authors;// authors in DB
	ac.genres;// genres in DB
	ac.publishers;// publishers in DB
	ac.libBranches;// library branches in DB
	ac.loans;// loans in DB
	ac.borrowers;// borrowers in DB
	ac.bookTitle;// title of book to add
	ac.sAuthor;// selected author
	ac.sGenre;// selected genre
	ac.sPublisher;// selected publisher
	ac.books;// books in DB
	ac.sBook = {};// selected book
	ac.chunks;// chunks of books
	ac.pgIdx;// page index
	ac.sLoan;// selected loan
	ac.sLibBranch;// selected branch
	ac.sBorrower;// selected borrower
	ac.sBooks;// multiselect values for book
	ac.sAuthors;// multiselect values for author
	ac.sGenres;// multiselect values for genre
	ac.sBooks;// multiselect values for book

	//TODO: Get bookid from location header
	ac.addBook = function() {
		ac.getLibBranches();
		$("#bookTitle").val("");
		$('#addModal').modal('hide');
		var authors;
		var genres;
		var publisher;
		var authorCount;
		var genreCount;
		if (ac.sAuthors == null) {
			authors = [];
		} else {
			authors = ac.sAuthors;
		}
		if (ac.sGenres == null) {
			genres = [];
		} else {
			genres = ac.sGenres;
		}
		publisher = ac.sPublisher;
		$http({
			method : "post",
			url : servDomain + "books",
			data : {
				title : ac.bookTitle,
				authors : authors,
				genres : genres,
				publisher : publisher
			}
		}).then(function(success) {
			var bookId = success.headers('Location').split('/').pop();
			for(var i = 0; i < ac.libBranches.length; i++){
				ac.addEntry(i, bookId);
			}
		});
	}

	ac.addEntry = function(branchIdx, bookId){
		$http({
			method : "post",
			url : servDomain + "branches/" +  ac.libBranches[branchIdx].branchId + "/branchBooks/" + bookId,
			data : {
				noOfCopies : 0
			}
		});
	}

	ac.addAuthor = function() {
		$("#authorName").val("");
		$('#2addModal').modal('hide');
		var books;
		if (ac.sBooks == null) {
			books = [];
		} else {
			books = ac.sBooks;
		}

		$http({
			method : "post",
			url : servDomain + "authors",
			data : {
				authorName : ac.authorName,
				books : books
			}
		});
	}

	ac.getAuthors = function() {
		ac.authors = [];
		$http({
			method : "get",
			url : servDomain + "authors",
		}).then(function(success) {
			ac.authors = success.data;
			ac.getGenres();
		});
	}

	ac.getGenres = function() {
		ac.genres = [];
		$http({
			method : "get",
			url : servDomain + "genres",
		}).then(function(success) {
			ac.genres = success.data;
			ac.getPublishers();
		});
	}

	ac.getPublishers = function() {
		ac.publishers = [];
		$http({
			method : "get",
			url : servDomain + "publishers",
		}).then(function(success) {
			ac.publishers = success.data;
			ac.getBooks();
		});
	}

	ac.getBooks = function(chunk) {
		ac.books = [];
		$http({
			method : "get",
			url : servDomain + "books",
		}).then(function(success) {
			ac.books = success.data;
			if (chunk)
				ac.chunk();
		});
	}

	ac.getLibBranches = function() {
		ac.libBranches = [];
		$http({
			method : "get",
			url : servDomain + "branches",
		}).then(function(success) {
			ac.libBranches = success.data;
		});
	}

	ac.getBorrowers = function() {
		ac.borrowers = [];
		$http({
			method : "get",
			url : servDomain + "borrowers",
		}).then(function(success) {
			ac.borrowers = success.data;
		});
	}

	ac.delBook = function(idx) {
		$http({
			method : "delete",
			url : servDomain + "books/" + ac.sBook.bookId
		});
		$('#delModal').modal('hide');
	}

	ac.delAuthor = function(idx) {
		$http({
			method : "delete",
			url : servDomain + "authors/" + ac.sAuthor.authorId,
		});
		$('#2delModal').modal('hide');
	}

	ac.searchBooks = function() {
		ac.books = [];
		$http({
			method : "get",
			url : servDomain + "books?title="+ac.searchVal
		}).then(function(success) {
			ac.books = success.data;
			ac.chunk();
		});
	}

	ac.chunk = function() {
		ac.chunks = ac.chunkArr(ac.books, 3);
		ac.pgIdx = 0;
	}

	ac.chunkArr = function(arr, groupsize) {
		var sets = [];
		var chunks = arr.length / groupsize;
		for (var i = 0, j = 0; i < chunks; i++, j += groupsize) {
			sets[i] = arr.slice(j, j + groupsize);
		}
		return sets;
	}

	ac.getLoans = function() {
		ac.loans = [];
		$http({
			method : "get",
			url : servDomain + "loans",
		}).then(function(success) {
			var len = success.data.length;
			for (var i = 0; i < len; i++) {
				if (success.data[i].dateIn == null) {
					ac.loans.push(success.data[i]);
					/*
					var temp = {};
					temp.borrower = success.data[i].borrower;
					temp.branch = success.data[i].branch;
					temp.book = success.data[i].book;
					temp.dueDate = success.data[i].dueDate;
					temp.dateOut = success.data[i].dateOut;
					ac.loans.push(temp);
					*/
				}
			}
		});
	}

	ac.addPublisher = function() {
		$("#publisherName").val("");
		$("#publisherAddress").val("");
		$("#publisherPhone").val("");
		$('#3addModal').modal('hide');
		$http({
			method : "post",
			url : servDomain + "publishers" ,
			data : {
				publisherName : ac.publisherElements.publisherName.value,
				publisherAddress : ac.publisherElements.publisherAddress.value,
				publisherPhone : ac.publisherElements.publisherPhone.value
			}
		});
	}

	ac.delPublisher = function() {
		$http({
			method : "delete",
			url : servDomain + "publishers/" + ac.sPublisher.publisherId,
		});
		$('#3delModal').modal('hide');
	}

	ac.addLibBranch = function() {
		$("#branchName").val("");
		$("#branchAddress").val("");
		$('#4addModal').modal('hide');
		$http({
			method : "post",
			url : servDomain + "branches",
			data : {
				branchName : ac.branchElements.branchName.value,
				branchAddress : ac.branchElements.branchAddress.value,
			}
		});
	}

	ac.delBranch = function() {
		$http({
			method : "delete",
			url : servDomain + "branches/" + ac.sLibBranch.branchId,
		});
		$('#4delModal').modal('hide');
	}

	ac.addBorrower = function() {
		$("#borrowerName").val("");
		$("#borrowerAddress").val("");
		$("#borrowerPhone").val("");
		$('#5addModal').modal('hide');
		$http({
			method : "post",
			url : servDomain + "borrowers",
			data : {
				name : ac.borrowerElements.borrowerName.value,
				address : ac.borrowerElements.borrowerAddress.value,
				phone : ac.borrowerElements.borrowerPhone.value
			}
		});
	}

	ac.delBorrower = function() {
		$http({
			method : "delete",
			url : servDomain + "borrowers/" + ac.sBorrower.cardNo,
		});
		$('#5delModal').modal('hide');
	}

	// x-editable code
	ac.xEd = function(op) {
		if (op == "book") {
			$('#bTitle').editable({
				type : 'text',
				value : ac.sBook.title,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 2) {
						return 'Title must be at least 2 characters';
					}
				},
				url: servDomain +"books/"+ac.sBook.bookId,
				pk: ac.sBook.bookId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sBook);
					delete data.bookId;
					data.title = params.value;
					return angular.toJson(data); 
				}
			});

		} else if (op == "author") {
			$('#aName').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sAuthor.authorName,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 3) {
						return 'Title must be at least 3 characters';
					}
				},
				url : servDomain + "authors/" + ac.sAuthor.authorId,
				pk : ac.sAuthor.authorId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sAuthor);
					delete data.authorId;
					data.authorName = params.value;
					return angular.toJson(data); 
				}
			});
		} else if (op == "publisher") {
			$('#pName').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sPublisher.publisherName,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 3) {
						return 'Name must be at least 3 characters';
					}
				},
				url : servDomain + "publishers/" + ac.sPublisher.publisherId,
				pk : ac.sPublisher.publisherId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sPublisher);
					delete data.publisherId;
					data.publisherName = params.value;
					return angular.toJson(data); 
				}
			});
			$('#pAddress').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sPublisher.publisherAddress,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 5) {
						return 'Address must be at least 5 characters';
					}
				},
				url : servDomain + "publishers/" + ac.sPublisher.publisherId,
				pk : ac.sPublisher.publisherId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sPublisher);
					delete data.publisherId;
					data.publisherAddress = params.value;
					return angular.toJson(data); 
				}
			});

			$('#pPhone').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sPublisher.publisherPhone,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 5) {
						return 'Phone must be at least 5 characters';
					}
				},
				pk : ac.sPublisher.publisherId,
				url : servDomain + "publishers/" + ac.sPublisher.publisherId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sPublisher);
					delete data.publisherId;
					data.publisherPhone = params.value;
					return angular.toJson(data); 
				}
			});
		} else if (op == "libBranch") {
			$('#bName').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sLibBranch.branchName,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 3) {
						return 'Name must be at least 3 characters';
					}
				},
				pk : ac.sLibBranch.branchId,
				url : servDomain + "branches/" + ac.sLibBranch.branchId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sLibBranch);
					delete data.branchId;
					data.branchName = params.value;
					return angular.toJson(data); 
				}
			});

			$('#bAddress').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sLibBranch.branchAddress,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 5) {
						return 'Address must be at least 5 characters';
					}
				},
				pk : ac.sLibBranch.branchId,
				url : servDomain + "branches/" + ac.sLibBranch.branchId,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sLibBranch);
					delete data.branchId;
					data.branchAddress = params.value;
					return angular.toJson(data); 
				}
			});
		} else if (op == "borrower") {
			$('#brName').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sBorrower.name,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 3) {
						return 'Name must be at least 3 characters';
					}
				},
				pk : ac.sBorrower.cardNo,
				url : servDomain + "borrowers/" + ac.sBorrower.cardNo,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sBorrower);
					delete data.cardNo;
					data.name = params.value;
					return angular.toJson(data); 
				}
			});

			$('#brAddress').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sBorrower.address,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 5) {
						return 'Address must be at least 5 characters';
					}
				},
				pk : ac.sBorrower.borrowerId,
				url : servDomain + "borrowers/" + ac.sBorrower.cardNo,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sBorrower);
					delete data.cardNo;
					data.address = params.value;
					return angular.toJson(data); 
				}
			});

			$('#brPhone').editable({
				type : 'text',
				mode : 'inline',
				value : ac.sBorrower.phone,
				placement : 'right',
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'This field is required';
					} else if ($.trim(value).length < 5) {
						return 'Phone must be at least 5 characters';
					}
				},
				pk : ac.sBorrower.borrowerId,
				url : servDomain + "borrowers/" + ac.sBorrower.cardNo,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sBorrower);
					delete data.cardNo;
					data.phone = params.value;
					return angular.toJson(data); 
				}
			});
		} else if (op == "loan") {
			$('#loanDD').editable({
				value : ac.sLoan.dueDate,
				mode : 'popup',
				placement : 'right',
				format : 'YYYY-MM-DD',
				combodate : {
					minYear : new Date(ac.sLoan.dateOut).getFullYear(),
					maxYear : new Date(ac.sLoan.dateOut).getFullYear() + 2
				},
				validate : function(value) {
					if ($.trim(value) == '') {
						return 'All fields are required';
					} else if (new Date(value) < new Date(ac.sLoan.dueDate)) {
						return 'Date must be greater than current Due Date';
					}
				},
				pk : '1',
				url : servDomain + 'loans/' + ac.sLoan.borrower.cardNo +  '/' + ac.sLoan.branch.branchId + '/' + ac.sLoan.book.bookId + '/' + ac.sLoan.dateOut,
				ajaxOptions: {
					type: 'put',
					contentType: 'application/json', 
				},
				params: function(params) {
					var data = jQuery.extend(true,{}, ac.sLoan);
					delete data.borrower;
					delete data.branch;
					delete data.book;
					delete data.dateOut;
					data.dueDate = params.value;
					return angular.toJson(data); 
				}
			});
		}
	}

	ac.xEdR = function(op) {
		if (op == "book") {
			$('#bTitle').editable('setValue', ac.sBook.title).editable(
				'option', 'pk', ac.sBook.bookId);
		} else if (op == "author") {
			$('#aName').editable('setValue', ac.sAuthor.authorName).editable(
				'option', 'pk', ac.sAuthor.authorId);
		} else if (op == "publisher") {
			$('#pName').editable('setValue', ac.sPublisher.publisherName)
				.editable('option', 'pk', ac.sPublisher.publisherId);
			$('#pAddress').editable('setValue', ac.sPublisher.publisherAddress)
				.editable('option', 'pk', ac.sPublisher.publisherId);
			$('#pPhone').editable('setValue', ac.sPublisher.publisherPhone)
				.editable('option', 'pk', ac.sPublisher.publisherId);
		} else if (op == "libBranch") {
			$('#bName').editable('setValue', ac.sLibBranch.branchName)
				.editable('option', 'pk', ac.sLibBranch.branchId);
			$('#bAddress').editable('setValue', ac.sLibBranch.branchAddress)
				.editable('option', 'pk', ac.sLibBranch.branchId);
		} else if (op == "borrower") {
			$('#brName').editable('setValue', ac.sBorrower.name).editable(
				'option', 'pk', ac.sBorrower.cardNo);
			$('#brAddress').editable('setValue', ac.sBorrower.address)
				.editable('option', 'pk', ac.sBorrower.cardNo);
			$('#brPhone').editable('setValue', ac.sBorrower.phone).editable(
				'option', 'pk', ac.sBorrower.cardNo);
		} else if (op == "loan") {
			$('#loanDD').editable('setValue', moment(ac.sLoan.dueDate))
				.editable('option', 'pk', '1').editable('option', 'combodate', {
				minYear : new Date(ac.sLoan.dateOut).getFullYear(),
				maxYear : new Date(ac.sLoan.dateOut).getFullYear() + 2
			});
		}

	}

});
