var userid = $('meta[name="userid"]').attr("content");
var useremail = $('meta[name="useremail"]').attr("content");
var websocket = $('meta[name="websocket"]').attr("content");
var logged = $('meta[name="logged"]').attr("content") === "1";
var type = $('meta[name="type"]').attr("content");
var imagem = $('meta[name="imagem"]').attr("content");
var socket = null;
var namespace;
var pedido_item = new Array();
var columns_grade = new Array();
var rede_item = new Array();
var adddataform = null;
var listaDatatableXML = new Array();
var listaDatatableVendas = new Array();
var listaDatatableRelation = new Array();
var listaDatatableErrors = new Array();
let selectedItensGrid = new Array();
var chaveID;
var timeOut;
var clicodDB;
// socket.emit("init", {
//     type: type,
//     logged: logged,
//     userid: userid,
//     useremail: useremail,
//     imagem: imagem,
// });

if (websocket != null) {
    socket = io(websocket)
    connect()
}

function connect() {
    socket.on("connect_error", function (msg) {
        console.log(msg)
        toastr.error("Conection lost...");
    });

    socket.on("users online", function (count) {
        $(".navbar-badge").text(count);
    });

    socket.on("notify", function (type, message) {
        notify(type, message);
    });
}


function notify(type, message) {
    if (type === "error") {
        toastr.error(message);
    } else if (type === "success") {
        toastr.success(message);
    } else if (type === "warning") {
        toastr.warning(message);
    }
}



(function ($) {
    "use strict";

    var rua = $("input[name='cliend']");
    var bairro = $("input[name='clibai']");
    var cidade = $("#climun");
    var estado = $("#cliufe");
    var pais = $("#clipai");


    var cfg_rua = $("input[name='cfgend']");
    var cfg_bairro = $("input[name='cfgbai']");
    var cfg_cidade = $("#cfgmun");
    var cfg_estado = $("#cfgufe");
    var cfg_pais = $("#cfgpai");

    namespace = {
        setarPaisEstadoCidade: function (codigoIBGE) {
            var url = "/cliente/get-pais-estado-cidade";
            var parametro = { parametro: codigoIBGE };
            $.get(url, parametro, function (item) {

                pais.select2("trigger", "select", {
                    data: item.pais,
                });
                estado.select2("trigger", "select", {
                    data: item.estado,
                });
                cidade.select2("trigger", "select", {
                    data: item.cidade,
                });

                cfg_pais.select2("trigger", "select", {
                    data: item.pais,
                });
                cfg_estado.select2("trigger", "select", {
                    data: item.estado,
                });
                cfg_cidade.select2("trigger", "select", {
                    data: item.cidade,
                });

                $("#clinro").focus();
                $("#cfgnum").focus();
            });
        },
        comboBoxSelectTags: function (id, url, parametros) {

            var elemento = $("#" + id);
            elemento.select2({
                tags: true,
                allowClear: true,
                ajax: {
                    url: url,
                    delay: 500,
                    type: "GET",
                    data: function (params) {
                        return $.extend(
                            {
                                parametro: params.term,
                            },
                            $.isFunction(parametros) ? parametros() : {}
                        );
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        if (XMLHttpRequest.status == 401) {
                            Swal.fire({
                                title: "Erro",
                                text:
                                    "Sua sessão expirou, é preciso fazer o login novamente.",
                                icon: "error",
                                showCancelButton: false,
                                allowOutsideClick: false,
                            }).then(function (result) {
                                $.limparBloqueioSairDaTela();
                                location.reload();
                            });
                        }
                    },
                    processResults: function (data, params) {
                        return {
                            results: $.map(data, function (item) {
                                return item; // { id: item.id, text: item.text, adicional : item.adicional };
                            }),
                        };
                    },
                    cache: true,
                },
                escapeMarkup: function (markup) {
                    return markup;
                },
                minimumInputLength: 1,
            });
        },
        comboBoxSelect: function (id, url, ident = 'id', pad = 5, parametros) {
            var elemento = $("#" + id);
            elemento.select2({
                allowClear: true,
                ajax: {
                    url: url,
                    delay: 500,
                    type: "GET",
                    data: function (params) {
                        return $.extend(
                            {
                                idempresa: $("#idempresa").val(),
                                parametro: params.term,
                            },
                            $.isFunction(parametros) ? parametros() : {}
                        );
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        if (XMLHttpRequest.status == 401) {
                            Swal.fire({
                                title: "Erro",
                                text:
                                    "Sua sessão expirou, é preciso fazer o login novamente.",
                                icon: "error",
                                showCancelButton: false,
                                allowOutsideClick: false,
                            }).then(function (result) {
                                $.limparBloqueioSairDaTela();
                                location.reload();
                            });
                        }
                    },
                    processResults: function (data, params) {
                        return {
                            results: $.map(data, function (item) {
                                //console.log('item',item[ident])
                                //item.id = item.id.toString().padStart(5, '0') + ' - ' + item.text
                                if (Number.isInteger(item[ident]))
                                    item[ident] = item[ident].toString().padStart(pad, '0')
                                item.text = item[ident] + ' - ' + item.text
                                return item;
                            }),
                        };
                    },
                    cache: true,
                },
                escapeMarkup: function (markup) {
                    return markup;
                },
                minimumInputLength: 1,
            });
        },
        scrollNav: function () {
            $(window).scrollTop(0);
            $(window).scroll(function () {
                var posicao = $(this).scrollTop();
                var nav = $(".nav-opcoes");

                if (posicao >= 57) nav.css({ top: "0px" });
                if (posicao < 57) nav.removeAttr("style");
            });
        },
        gridDataTable: function (
            colunas,
            colunasConfiguracao,
            colunaFixa,
            selectStyle,
            url, valores
        ) {

            // console.log($(".pesquisaData").is(
            //     ":visible"
            // ));

            {
                var dataTable = $("#gridtemplate")
                    .on("processing.dt", function (e, settings, processing) {
                        if (processing) {
                            Pace.stop();
                            Pace.start();
                        } else {
                            Pace.stop();
                        }
                    })
                    .DataTable({
                        // dom: 'rt<"bottom"iflp>',
                        processing: true,
                        serverSide: false,
                        responsive: true,
                        paging: true,
                        lengthChange: true,
                        "pageLength": 100,
                        lengthMenu: [
                            [10, 50, 100, -1],
                            [10, 50, 100, 'Todos']
                        ],
                        searching: false,
                        ordering: true,
                        info: true,
                        autoWidth: false,
                        rowId: "id",
                        language: {
                            select: {
                                rows: {
                                    _: "%d selecionados",
                                    0: "",
                                    1: "1 selecionado",
                                },
                            },
                            sEmptyTable: "Nenhum registro encontrado",
                            sInfo:
                                "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                            sInfoEmpty: "Mostrando 0 até 0 de 0 registros",
                            sInfoFiltered: "(Filtrados de _MAX_ registros)",
                            sInfoPostFix: "",
                            sInfoThousands: ".",
                            sLengthMenu: "_MENU_ resultados por página",
                            sLoadingRecords: "Carregando...",
                            sProcessing: "Processando...",
                            sZeroRecords: "Nenhum registro encontrado",
                            sSearch: "Pesquisar",
                            oPaginate: {
                                sNext: "Próximo",
                                sPrevious: "Anterior",
                                sFirst: "Primeiro",
                                sLast: "Último",
                            },
                            oAria: {
                                sSortAscending:
                                    ": Ordenar colunas de forma ascendente",
                                sSortDescending:
                                    ": Ordenar colunas de forma descendente",
                            },
                        },
                        "footerCallback": function (row, data, start, end, display) {
                            if (valores.totaliza) {
                                var api = this.api(), data;

                                // converting to interger to find total
                                var intVal = function (i) {
                                    return typeof i === 'string' ?
                                        i.replace(/[\R$,]/g, '') * 1 :
                                        typeof i === 'number' ?
                                            i : 0;
                                };

                                if (valores.qtd > 0) {
                                    // computing column Total of the complete result
                                    var qtdTotal = api
                                        .column(valores.qtd)
                                        .data()
                                        .reduce(function (a, b) {
                                            return intVal(a) + intVal(b);
                                        }, 0);
                                }

                                if (valores.vlr > 0) {
                                    var valorTotal = api
                                        .column(valores.vlr)
                                        .data()
                                        .reduce(function (a, b) {
                                            return intVal(a) + intVal(b);
                                        }, 0);
                                }
                                // Update footer by showing the total with the reference of the column index
                                $(api.column(0).footer()).html('Total: ');
                                $(api.column(valores.qtd).footer()).html(qtdTotal);
                                $(api.column(valores.vlr).footer()).html($.toMoney(valorTotal));
                            }
                        },
                        ajax: {
                            url: "/" + url + "/obtergridpesquisa",
                            data: {
                                parametro: $("#inputPesquisa").val(),
                                idFiltro: $("#idFiltro option:selected").val(),
                                idSituacao: $("#idSituacao option:selected").val(),
                                dataInicial: $("#dataInicial").val(),
                                dataFinal: $("#dataFinal").val(),
                                numInicial: $("#numInicial").val(),
                                numFinal: $("#numFinal").val(),
                                pesquisarDatas: $(".pesquisaData").is(":visible"),
                                status: $("#status").val(),
                                //idDropDrownList: $('#idDropDownList').val()
                            },
                            error: function (XMLHttpRequest, textStatus, errorThrown) {
                                if (XMLHttpRequest.status == 401) {
                                    Swal.fire({
                                        title: "Erro",
                                        text:
                                            "Sua sessão expirou, é preciso fazer o login novamente.",
                                        icon: "error",
                                        showCancelButton: false,
                                        allowOutsideClick: false,
                                    }).then(function (result) {
                                        $.limparBloqueioSairDaTela();
                                        location.reload();
                                    });
                                }
                            },
                        },
                        columns: colunas,
                        columnDefs: colunasConfiguracao,
                        fixedColumns: colunaFixa,
                        //select: selectStyle,
                        select: {
                            style: selectStyle,
                            selector: 'td:first-child'
                        },
                        order: [[1, "desc"]],
                    });
                new $.fn.dataTable.FixedHeader(dataTable);
            }
        },
        swalDelete: function (id, urlDelete) {
            var dataTable = $("#gridtemplate").DataTable();
            Swal.fire({
                title: "Deletar?",
                text: "Deseja realmente deletar?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Sim, deletar!",
                showLoaderOnConfirm: true,
                preConfirm: function () {
                    return new Promise(function (resolve) {
                        var token = $('meta[name="csrf-token"]').attr(
                            "content"
                        );
                        var url = "/" + urlDelete + "/" + id;
                        console.log(url)
                        $.ajax({
                            header: {
                                "X-CSRF-TOKEN": token,
                            },
                            url: url,
                            type: "post",
                            data: { id: id, _method: "delete", _token: token },
                        })
                            .done(function (response) {
                                Swal.fire({
                                    title: response.title,
                                    text: response.text,
                                    icon: response.type,
                                    showCancelButton: false,
                                    allowOutsideClick: false,
                                }).then(function (result) {

                                    console.log(result)
                                    if (response.type === "error") return;

                                    if (result.value) {
                                        $("#btnPesquisar").trigger('click');
                                    }
                                });
                            })
                            .fail(function (xhr, status, error) {
                                console.log('xhr status:', xhr.status);
                                console.log('error:', error);
                                console.log('status:', status);

                                if (xhr.status == 403) {
                                    Swal.fire(
                                        "Oops...",
                                        "Você não tem permissão para deletar, contate o administrador!",
                                        "error"
                                    );
                                } else if (xhr.status == 400) {
                                    Swal.fire(
                                        "Oops...",
                                        xhr.responseJSON.message,
                                        "error"
                                    );
                                } else if (xhr.status == 422) {
                                    Swal.fire(
                                        "Oops...",
                                        xhr.responseJSON.message,
                                        "error"
                                    );
                                }
                                else if (xhr.status == 406) {
                                    Swal.fire(
                                        "Oops...",
                                        xhr.responseJSON.message,
                                        "error"
                                    );
                                } else {
                                    Swal.fire(
                                        "Oops...",
                                        "Algo deu errado ao tentar delatar!",
                                        "error"
                                    );
                                }
                            });
                    });
                },
                allowOutsideClick: false,
            });
        },
        getCNPJOnClick: function (id) {
            try {
                var cnpj = $("#" + id).val().replace(/\D/g, "");
            console.log('cnpj', cnpj)
            if (cnpj != "") {
                var validacnpj = /^[0-9]{14}$/;

                console.log('validacnpj', validacnpj)
                if (validacnpj.test(cnpj)) {
                    $.loading();
                    var url = "//receitaws.com.br/v1/cnpj/" + cnpj;
                    const settings = {
                        async: true,
                        crossDomain: true,
                        url: '//receitaws.com.br/v1/cnpj/'+ cnpj,
                        method: 'GET',
                        headers: {
                          Accept: 'application/json'
                        }
                      };

                      $.ajax(settings).done(function (response) {
                        console.log(response);
                      });
                    // $.ajax({
                    //     type: "GET",
                    //     url: url,
                    //     crossDomain: true,
                    //     dataType: 'jsonp',
                    //     success: function (data) {
                    //         $.removeLoading();
                    //         console.log('data', data)

                    //     },
                    //     error: function (xhr, status, error) {
                    //         $.removeLoading();
                    //         console.log(xhr.responseJSON)
                    //     },
                    // });
                } else {
                    limpa_formulario_cep();
                    Swal.fire(
                        "Oops...",
                        "Formato de CEP inválido.",
                        "error"
                    );
                }
            } else {
                Swal.fire(
                    "Oops...",
                    "O CNPJ não pode ficar em branco.",
                    "error"
                );
            }
            } catch (error) {
                $.removeLoading();
                console.log(error); // Logs the error
            }
        },

        cepOnClick: function (id) {
            var cep = $("#" + id).val().replace(/\D/g, "");
            console.log('cep', cep)
            if (cep != "") {
                var validacep = /^[0-9]{8}$/;

                if (validacep.test(cep)) {
                    rua.val("...");
                    bairro.val("...");
                    cidade.val("...");

                    var url = "//viacep.com.br/ws/" + cep + "/json/?callback=?";
                    $.getJSON(url, function (dados) {
                        if (!("erro" in dados)) {
                            rua.val(dados.logradouro);
                            bairro.val(dados.bairro);
                            cfg_rua.val(dados.logradouro);
                            cfg_bairro.val(dados.bairro);
                            setarPaisEstadoCidade(dados.ibge);
                        } else {
                            limpa_formulario_cep();
                            Swal.fire(
                                "Oops...",
                                "CEP não encontrado.",
                                "error"
                            );

                        }
                    });
                } else {
                    limpa_formulario_cep();
                    Swal.fire(
                        "Oops...",
                        "Formato de CEP inválido.",
                        "error"
                    );
                }
            } else limpa_formulario_cep();
        },
        visualizarUpdate: function () {
            var visualizar = document.URL.split("/")[5] == "visualizar";

            if (visualizar) {
                $("#btnSalvar").attr("disabled", "disabled");
                $("form :input").prop("disabled", true);
                setTimeout(() => {
                    $("#deleteAll").prop("disabled", true);
                    $(".DeleteItem").prop("disabled", true);
                }, 250);
                $("#formPrincipal").attr("action", "#");
                $("#formPrincipal").attr("method", "");
                window.onbeforeunload = function () {
                    return null;
                };
                setTimeout(() => {
                    $.limparBloqueioSairDaTela();
                }, 850);
            }
        },
        sendForm: function () { },
        sendForm1: function (formData) {
            $("#formPrincipal").on("submit", function (e) {
                $.ajaxSetup({
                    headers: {
                        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                    },
                });

                e.preventDefault();

                var url = $(this).attr("action");
                var formData = new FormData(this);

                var html =
                    '<div class="alert alert-danger alert-dismissible" id="message" style="display: none">' +
                    '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' +
                    '<ul id="errors"></ul></div>';
                $.ajax({
                    type: "POST",
                    url: url,
                    data: formData,
                    cache: false,

                    success: function (data) {
                        $.limparBloqueioSairDaTela();
                        setTimeout(function () {
                            toastr.success(data.message);
                        }, 200);
                        var urll = document.URL.split("/")[3];
                        location.replace("/" + urll);
                        $("#image-product").attr("src", data.uploaded_image);
                    },
                    // statusCode: {
                    //     401: function() {
                    //         window.location.href = '/'; //or what ever is your login URI
                    //     }
                    // },
                    //    error: (response) => {
                    //     if(response.status === 422) {
                    //         let errors = response.responseJSON.errors;
                    //         Object.keys(errors).forEach(function (key) {
                    //             $("#" + key + "Input").addClass("is-invalid");
                    //             $("#" + key + "Error").children("strong").text(errors[key][0]);
                    //         });
                    //     } else {
                    //         window.location.reload();
                    //     }},
                    error: function (xhr, status, error) {
                        $.removeLoading();
                        $(".errors").html(html);
                        $("#message").css("display", "block");
                        $("#message").removeClass("alert-success");
                        $("#message").addClass(xhr.responseJSON.class_name);
                        $("#errors").empty();

                        if (xhr.status == 422) {
                            let errors = xhr.responseJSON.message;
                            Object.keys(errors).forEach(function (key, value) {
                                $("#" + key).addClass("is-invalid");
                                //$("#" + key ).val(errors[key][0]);
                                $("#" + key + "Error").html(errors[key][0]);
                                $("#" + key)
                                    .closest(".form-group")
                                    .find(".select2-selection")
                                    .css("border-color", "#dc3545")
                                    .addClass("text-danger");
                            });

                            $.each(xhr.responseJSON.message, function (key, item) {
                                toastr.error(item);
                                $("#errors").append("<li>" + item + "</li>");
                            });
                        } else {
                            toastr.error(xhr.responseJSON.message);
                        }

                        $("#btnSalvar").html('<i class="icon fas fa-save"></i> Salvar');
                        $("#btnSalvar").habilitar();

                    },
                });
            });
        },
        iniciarlizarMascaras: function () {
            $(".date").mask("00/00/0000");
            $(".cep").mask("00000-000");
            $(".phone").mask("0000-0000");
            $(".placa").mask("AAA-0000");
            $(".date_time").mask("00/00/0000 00:00:00");
            $(".cell_with_ddd").mask("(00) 00000-0000");
            $(".phone_with_ddd").mask("(00) 0000-0000");
            $(".cpf").mask("000.000.000-00", { reverse: true });
            $(".cnpj").mask("00.000.000/0000-00", { reverse: true });
           // $(".money").mask("#.##0,00", { reverse: true });
            //$(".trescasasdecimais").mask("#.##0,000", { reverse: true });
            //$(".quatrodecimais").mask("#.####0,0000", { reverse: true });
            $(".porcentagem").mask("##0,00%", { reverse: true });

            $(".money").formatCurrency($.extend({ colorize: false, roundToDecimalPlace: 2, negativeFormat: '-%s%n' }, $.formatCurrency.regions['pt-BR']));
            $(".trescasasdecimais").formatCurrency($.extend({ colorize: false, roundToDecimalPlace: 3, negativeFormat: '-%s%n' }, $.formatCurrency.regions['pt-BR-QTD']));
            $(".quatrodecimais").formatCurrency($.extend({ colorize: false, roundToDecimalPlace: 4, negativeFormat: '-%s%n' }, $.formatCurrency.regions['pt-BR-QTD']));
        },
        inicializarEventos: function () {
            // $("#formPrincipal").validate();
            shortcut.add("Enter", function (e) {
                var elementoSelect2Fechado = !$(e.srcElement)
                    .attr("class")
                    .includes("select2");
                var elementoSemFocus = !$(e.target).is(":focus");
                var modalFechado = $(".modal.fade.in").length == 0;

                if (elementoSelect2Fechado && elementoSemFocus && modalFechado)
                    $("#btnSalvar").trigger("click");
            });
        },
        selectAll: function (e) {
            e.preventDefault();
                clearTimeout(timeOut);
                timeOut = setTimeout(function () {

                $.each(selectedItensGrid, function (key, value) {
                    console.log('selectAll selectedItensGrid', value);
                    if(value.selected){
                        $("#dt-checkboxes-grid-" + value.id).trigger("click");
                    }
                });

                }, 250);

        }
    };

    var obterIdsSelecionadoGridItens = function () {
        var lista_de_pedidos = $("#gridtemplate").DataTable();
        var idArray = lista_de_pedidos.rows({ selected: true }).data().toArray();
        //console.log('idArray', idArray)

        return idArray;
    };

    $('body').on("blur", ".money", function (event) {
        $(this).formatCurrency($.extend({ colorize: false, roundToDecimalPlace: 2, negativeFormat: '-%s%n' }, $.formatCurrency.regions['pt-BR']));
    });

    $('body').on("blur", ".trescasasdecimais", function (event) {
        $(this).formatCurrency($.extend({ colorize: false, roundToDecimalPlace: 3, negativeFormat: '-%s%n' }, $.formatCurrency.regions['pt-BR-QTD']));
    });

    $('body').on("blur", ".quatrodecimais", function (event) {
        $(this).formatCurrency($.extend({ colorize: false, roundToDecimalPlace: 4, negativeFormat: '-%s%n' }, $.formatCurrency.regions['pt-BR-QTD']));
    });

    $('body').on("change", "#selectAllRedes", function (event) {
        event.preventDefault();
        let checked = $(this).is(':checked');
        if (checked) {
            $('#redes').find('option').prop('selected', true);
            $('#redes').trigger('change');
        } else {
            $('#redes').find('option').prop('selected', false);
            $('#redes').trigger('change');
        }
    });

    $('body').on("change", "#selectAllRegional", function (event) {
        event.preventDefault();
        let checked = $(this).is(':checked');
        if (checked) {
            $('#regional').find('option').prop('selected', true);
            $('#regional').trigger('change');
        } else {
            $('#regional').find('option').prop('selected', false);
            $('#regional').trigger('change');
        }
    });

    $('body').on("change", "#selectAllSubRedes", function (event) {
        event.preventDefault();
        let checked = $(this).is(':checked');
        if (checked) {
            $('#subredes').find('option').prop('selected', true);
            $('#subredes').trigger('change');
        } else {
            $('#subredes').find('option').prop('selected', false);
            $('#subredes').trigger('change');
        }
    });

    $('body').on("change", "#selectAllGrupo", function (event) {
        event.preventDefault();
        let checked = $(this).is(':checked');
        if (checked) {
            $('#grupos').find('option').prop('selected', true);
            $('#grupos').trigger('change');
        } else {
            $('#grupos').find('option').prop('selected', false);
            $('#grupos').trigger('change');
        }
    });

    $('body').on("change", "#selectAllEdicao", function (event) {
        event.preventDefault();
        let checked = $(this).is(':checked');
        if (checked) {
            $('#edicao').find('option').prop('selected', true);
            $('#edicao').trigger('change');
        } else {
            $('#edicao').find('option').prop('selected', false);
            $('#edicao').trigger('change');
        }
    });

    $("body").on("change", "#selecionatodosGrid", function (e) {

        e.preventDefault();
        var isChecked = $(this).prop('checked')

        var parametro = obterIdsSelecionadoGridItens();

        if(parametro.length == 0){
            $.each(selectedItensGrid, function (key, value) {
                value.selected = false;
            });
        }

        $.each(parametro, function(key, value){

            var item = {'id': parseInt(value.id), 'selected': isChecked};

            $("#dt-checkboxes-grid-" + value.id).trigger("click");
            var ids = _.map(selectedItensGrid, 'id');

            if (!_.includes(ids, item.id)) {
                selectedItensGrid.push(item);
            } else {
                var index = _.findIndex(selectedItensGrid, {
                    id: item.id
                });
                selectedItensGrid[index].selected = isChecked;
            }

        });

        // clearTimeout(timeOut);
        // timeOut = setTimeout(function () {

        // $.each(selectedItensGrid, function (key, value) {
        //     console.log('selectAll selectedItensGrid', value);
        //     if(value.selected){
        //         $("#dt-checkboxes-grid-" + value.id).trigger("click");
        //     }
        // });

        // }, 250);

    });

    $("body").on("change", ".check-list-grid", function (e) {

        e.preventDefault();
        var id = $(this).attr("data-id");
        var item = {'id': parseInt(id), 'selected': $(this).prop('checked')};

        var ids = _.map(selectedItensGrid, 'id');

        if (!_.includes(ids, item.id)) {
            selectedItensGrid.push(item);
        } else {
            var index = _.findIndex(selectedItensGrid, {
                id: item.id
            });
            selectedItensGrid[index].selected = $(this).prop('checked');
        }

        console.log('change selectedItensGrid', selectedItensGrid)
    });

    var salvarOnClick = function (e) {
        $(this).text("Salvando...");
        $(this).desabilitar();
        $.loading();
    };

    $("body").on("click", "#btnSalvar", function () {

        var visualizar = document.URL.split("/")[5] == "visualizar";
        if (visualizar) {
            Swal.fire(
                "Oops...",
                "Você não pode executar está ação.",
                "error"
            );
            return;
        }

        $(this).text("Salvando...");
        $(this).desabilitar();
        $.loading();
        $("#formPrincipal").submit();
    });

    $("#formPrincipal").on("submit", function (e) {
        //debugger;
        $.ajaxSetup({
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
        });

        e.preventDefault();

        var url = $(this).attr("action");
        var formData = new FormData(document.getElementById("formPrincipal"));

        if (pedido_item.length > 0) {
            createFormData(formData, 'itens', pedido_item);
        }

        if (rede_item.length > 0) {
            createFormData(formData, 'rede_item', rede_item);
        }

        var object = {};
        formData.forEach((value, key) => {
            object[key] = value
        });
        var json = JSON.stringify(object);
        //console.log('formData :', json)

        var html =
            '<div class="alert alert-danger alert-dismissible" id="message" style="display: none">' +
            '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' +
            '<ul id="errors"></ul></div>';

        $.ajax({
            type: "POST",
            url: url,
            data: formData,
            cache: false,
            dataType: "json",
            contentType: false,
            processData: false,
            success: function (data) {
                $.limparBloqueioSairDaTela();
                setTimeout(function () {
                    toastr.success(data.message);
                }, 300);
                var urll = document.URL.split("/")[3];

                location.replace("/" + urll);
                $("#image-product").attr("src", data.uploaded_image);
            },
            // statusCode: {
            //     401: function() {
            //         window.location.href = '/'; //or what ever is your login URI
            //     }
            // },
            //    error: (response) => {
            //     if(response.status === 422) {
            //         let errors = response.responseJSON.errors;
            //         Object.keys(errors).forEach(function (key) {
            //             $("#" + key + "Input").addClass("is-invalid");
            //             $("#" + key + "Error").children("strong").text(errors[key][0]);
            //         });
            //     } else {
            //         window.location.reload();
            //     }},
            error: function (xhr, status, error) {
                $.removeLoading();
                console.log(xhr.responseJSON)
                $(".errors").html(html);
                $("#message").css("display", "block");
                $("#message").removeClass("alert-success");
                $("#message").addClass(xhr.responseJSON.class_name);
                $("#errors").empty();

                if (xhr.status == 422) {
                    let errors = xhr.responseJSON.message;
                    Object.keys(errors).forEach(function (key, value) {
                        $("#" + key).addClass("is-invalid");
                        //$("#" + key ).val(errors[key][0]);
                        $("#" + key + "Error").html(errors[key][0]);
                        $("#" + key)
                            .closest(".form-group")
                            .find(".select2-selection")
                            .css("border-color", "#dc3545")
                            .addClass("text-danger");

                        if (key === 'itens') {
                            var element = document.getElementById('pedctr')
                            if (element)
                                element.scrollIntoView();
                            $("#idproduto").selectOpen();
                        }
                    });

                    $.each(xhr.responseJSON.message, function (key, item) {
                        toastr.error(item);
                        $("#errors").append("<li>" + item + "</li>");
                    });
                } else {
                    toastr.error(xhr.responseJSON.message);
                }

                $("#btnSalvar").html('<i class="icon fas fa-save"></i> Salvar');
                $("#btnSalvar").habilitar();

            },
        });
    });

    var setarPaisEstadoCidade = function (codigoIBGE) {
        var url = "/cliente/get-pais-estado-cidade";
        var parametro = { parametro: codigoIBGE };
        $.get(url, parametro, function (item) {

            pais.select2("trigger", "select", {
                data: item.pais,
            });
            estado.select2("trigger", "select", {
                data: item.estado,
            });
            cidade.select2("trigger", "select", {
                data: item.cidade,
            });

            cfg_pais.select2("trigger", "select", {
                data: item.pais,
            });
            cfg_estado.select2("trigger", "select", {
                data: item.estado,
            });
            cfg_cidade.select2("trigger", "select", {
                data: item.cidade,
            });

            $("#clinro").focus();
            $("#cfgnum").focus();
        });
    };

    var limpa_formulario_cep = function () {
        rua.val("");
        bairro.val("");
        cidade.val("");
        cfg_rua.val("");
        cfg_bairro.val("");
        cfg_cidade.val("");
    };

    var setarFocus = function (elemento) {
        if (elemento.is(":focus")) return;
        else {
            elemento.focus().select();
            setTimeout(function () {
                setarFocus(elemento);
            }, 100);
        }
    };

    var createFormData = function (formData, key, data) {
        if (data === Object(data) || Array.isArray(data)) {
            for (var i in data) {
                createFormData(formData, key + '[' + i + ']', data[i]);
            }
        } else {
            formData.append(key, data);
        }
    }

    Date.prototype.addDays = function (days) {
        const date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    };

    jQuery.validarErrorGrid = function (retorno) {
        var mensagem = retorno["error"];
        if ($.isNotNullAndNotEmpty(mensagem)) {
            $("#divErros").show();
            $("#divErros").html(
                '<div class="callout callout-danger bg-red disabled color-palette">' +
                '    <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' +
                "    <h4>Alerta!</h4>" +
                '    <div id="erros" hidden data="{!! json_encode(array_keys($errors->default->messages())) !!}"></div>' +
                "    <ul>" +
                "               <li>" +
                mensagem +
                "</li>" +
                "    </ul>" +
                "</div>"
            );
            var gridTemplate = $("#gridtemplate");
            var item = gridTemplate.obterLinhaGridItem();
            //gridTemplate.getKendoGrid().dataSource.read({ id: item.id });
            return true;
        } else {
            $("#divErros").hide();
            return false;
        }
    };


    jQuery.bloquearSairDaTela = function () {
        setTimeout(function () {
            window.onbeforeunload = function () {
                return "É possivel que as alterações feitas não sejam salvas.";
            };
        }, 500);
    };

    jQuery.limparBloqueioSairDaTela = function () {
        window.onbeforeunload = function () {
            return null;
        };
    };

    jQuery.isNotNullAndNotEmpty = function (texto) {
        return texto != null && texto != undefined && texto != "";
    };

    jQuery.FormularioAlterar = function () {
        return $("input[name='cod']").val() > 0;
    };

    jQuery.gridTemplateValido = function () {
        return (
            $("#gridtemplate").length > 0 &&
            $.isFunction($("#gridtemplate").getKendoGrid) &&
            $("#gridtemplate").getKendoGrid() != undefined
        );
    };

    jQuery.fn.tryFocus = function () {
        var elemento = $(this);
        setarFocus(elemento);
    };

    jQuery.fn.isNullOrEmpty = function () {
        var elemento = $(this);
        return (
            elemento.val() == null ||
            elemento.val() == undefined ||
            elemento.val() == ""
        );
    };

    jQuery.isNullOrEmpty = function () {
        var elemento = $(this);
        return (
            elemento.val() == null ||
            elemento.val() == undefined ||
            elemento.val() == ""
        );
    };

    jQuery.fn.selectOpen = function () {
        $(this).select2("open");
    };

    jQuery.fn.isNotNullAndNotEmpty = function () {
        var elemento = $(this);
        return $.isNotNullAndNotEmpty(elemento.val());
    };

    jQuery.toMoney = function (texto) {
        texto = $.isNotNullAndNotEmpty(texto) ? texto + "" : "0";
        return $.fn.dataTable.render
            .number(".", ",", 2, "R$ ")
            .display(texto.replace(",", "."));
    };

    $.toMoneyVenda = function (valor) {
        return $.toMoneyVendaSimples(valor, true);
    };

    $.tratarValor = function (valor) {
        if (valor == undefined) return 0;

        var retorno = valor.replace(".", "").replace(",", ".");
        if (retorno < 0) return 0;

        return parseFloat(retorno);
    };

    $.toMoneyVendaSimples = function (valor, gerarTexto) {
        if (valor == undefined) return 0.0;

        if ($.isNumeric(valor)) {
            if (valor == "0.00") return 0.0;

            var novoValor = (valor + "").split(".");
            if (novoValor.length == 2 && (valor + "").split(".")[1].length >= 2)
                return $.toMoneySimples(novoValor);
            else if (
                novoValor.length == 2 &&
                (valor + "").split(".")[1].length == 1
            )
                return $.toMoneySimples(novoValor + "0");

            valor = valor + "".replace(".", ",") + ".00";
        }

        var resultado = "";
        var numeros = valor.split(",");
        var quantidadeSplit = numeros.length;

        $.each(numeros, function (index, elemento) {
            if (quantidadeSplit == index + 1)
                resultado += elemento.replace(".", ",") + ".";
            else resultado += elemento + ".";
        });

        return (
            (gerarTexto ? "R$" : "") +
            resultado.substring(0, resultado.length - 1)
        );
    };

    $.toMoneySimples = function (texto, casasDecimais) {
        texto = $.isNotNullAndNotEmpty(texto) ? texto + "" : "0";
        return $.fn.dataTable.render
            .number(
                ".",
                ",",
                casasDecimais == undefined ? 2 : casasDecimais,
                ""
            )
            .display(texto.replace(",", "."));
    };

    jQuery.executarChamadaAjax = async function (e, funcaoChamada) {
        e.preventDefault();
        $.loading();
        await funcaoChamada();
        //setTimeout(function () {
        $.removeLoading();
        //}, 100);
    };

    jQuery.callbackAjaxGridWithID = function (e, callback, id) {
        e.preventDefault();
        var grid = $("#"+id);
        var linha = grid.obterLinhaGridItemWithID(id);
        //console.log('linha', linha);

        if (linha == null) {
            Swal.fire("Alerta!", "Selecione um registro", "error");
        } else {
            Pace.restart();
            Pace.track(function () {
                callback();
            });

           // $.loading();
            //await funcaoChamada();
            //setTimeout(function () {
           // $.removeLoading();
            //}, 100);
        }
    };

    jQuery.executarChamadaAjaxGrid = function (e, funcaoChamada) {
        e.preventDefault();
        var grid = $("#gridtemplate");
        var linha = grid.obterLinhaGridItem();
        //console.log(linha);

        if (linha == null) {
            Swal.fire("Alerta!", "Selecione um registro", "error");
        } else {
            Pace.restart();
            Pace.track(function () {

             funcaoChamada();
            });

           // $.loading();
            //await funcaoChamada();
            //setTimeout(function () {
           // $.removeLoading();
            //}, 100);
        }
    };

    jQuery.minimizarEBloquearMenuLateral = function () {
        $("body").addClass("sidebar-collapse");
        $("body").removeClass("fixed");
    };

    jQuery.fn.obterLinhaGridItemWithID = function (id) {
        var grid = $("#"+id)
            .DataTable()
            .row({ selected: true })
            .data();
        return grid;
    };

    jQuery.fn.obterLinhaGridItem = function () {
        var grid = $("#gridtemplate")
            .DataTable()
            .row({ selected: true })
            .data();
        return grid;
    };

    jQuery.fn.obterLinhaGridItemId = function () {
        return $(this).obterLinhaGridItem().id;
    };

    jQuery.loading = function () {
        $(".se-pre-con").show();
    };

    jQuery.removeLoading = function () {
        $(".se-pre-con").hide();
    };

    jQuery.getIdEmpresa = function () {
        var comboEmpresa = $("#idempresa :selected");
        var idEmpresa = 0;

        if (comboEmpresa.length > 0)
            idEmpresa = $("#idempresa :selected").attr("id");
        else throw new userException("idEmpresa não selecionado");

        return idEmpresa;
    };

    jQuery.fn.desabilitar = function () {
        $(this).attr("disabled", "disabled");
    };

    jQuery.fn.habilitar = function () {
        $(this).removeAttr("disabled");
    };

    toastr.options = {
        closeButton: true,
        debug: false,
        newestOnTop: true,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "8000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut",
    };

    var overlay = $(
        '<div class="overlay"><div class="fa fa-refresh fa-spin"></div></div>'
    );
    jQuery.fn.startLoad = function () {
        $(this).append(overlay);
    };

    jQuery.fn.removeLoad = function () {
        $(this).find(overlay).remove();
    };

    jQuery.toastrMsg = function (data) {
        switch (data.type) {
            case "success":
                toastr.success(data.message, data.title);
                break;
            case "info":
                toastr.info(data.message, data.title);
                break;
            case "warning":
                toastr.warning(data.message, data.title);
                break;
            case "error":
                toastr.error(data.message, data.title);
                break;
        }
    };

    // $("#showModalProduto").on("click", function () {
    //     Pace.restart();
    //     Pace.track(function () {
    //         socket.emit("chama guiche", {
    //             idvenda: $(".IncOrDecToCart").val(),
    //         });
    //     });
    // });

    window.ns = namespace;
})(this.jQuery);

$(document).ready(function () {
    $(document).on('select2:open', () => {
        document.querySelector('.select2-search__field').focus();
    });

    ns.scrollNav();
    ns.inicializarEventos();
    ns.iniciarlizarMascaras();
    $.fn.select2.defaults.set("language", "pt-BR");
    $(".select2").select2();

    $('body').on('change', '.select2', function () {
        var key = $(this).attr('data-select2-id');
        $("#" + key + "Error").html('');
        $("#" + key)
            .closest(".form-group")
            .find(".select2-selection")
            .css("border-color", "#ced4da")
            .removeClass("text-danger");
    })

    $("body").on("keyup", "input[type='text']", function (e) {
        var id = $(this).attr('name');
        if ($(this).hasClass('is-invalid'))
            $('#' + id + 'Error').html("");


        $(this).removeClass('is-invalid');
    });

    $("body").on("click", "input[type='text']", function (e) {
        var id = $(this).attr('name');
        if ($(this).hasClass('is-invalid'))
            $('#' + id + 'Error').html("");


        $(this).removeClass('is-invalid');
    });

    // $(document).on('dblclick', '#gridtemplate tbody tr', function () {
    //     var id = $('#gridtemplate').DataTable().row( this ).id();
    //     window.location = '/pedido-venda/'+ parseInt(id) + '/alterar';
    // });

    ns.visualizarUpdate();
});
