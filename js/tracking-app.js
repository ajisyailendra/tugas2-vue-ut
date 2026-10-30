(function () {
  var KUNCI = "sitta-tracking-v1";
  function salin(data) {
    return JSON.parse(JSON.stringify(data));
  }
  function bacaTracking() {
    try {
      return (
        JSON.parse(localStorage.getItem(KUNCI)) || salin(SITTA_DATA.tracking)
      );
    } catch (e) {
      return salin(SITTA_DATA.tracking);
    }
  }
  function tanggalHariIni() {
    var d = new Date(),
      m = String(d.getMonth() + 1).padStart(2, "0"),
      h = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + h;
  }
  new Vue({
    el: "#trackingApp",
    data: {
      pengirimanList: SITTA_DATA.pengirimanList,
      paket: SITTA_DATA.paket,
      tracking: bacaTracking(),
      kataKunci: "",
      pesanForm: "",
      sukses: "",
      form: {
        nim: "",
        nama: "",
        ekspedisi: "",
        paket: "",
        tanggalKirim: tanggalHariIni(),
      },
    },
    computed: {
      paketTerpilih: function () {
        var kode = this.form.paket;
        return (
          this.paket.find(function (item) {
            return item.kode === kode;
          }) || null
        );
      },
      doTerpilih: function () {
        return this.tracking[this.kataKunci] || null;
      },
      nomorDOBerikut: function () {
        var tahun = new Date().getFullYear(),
          nomor = 0;
        Object.keys(this.tracking).forEach(function (key) {
          var cocok = key.match(new RegExp("^DO" + tahun + "-(\\d+)$"));
          if (cocok) nomor = Math.max(nomor, Number(cocok[1]));
        });
        return "DO" + tahun + "-" + String(nomor + 1).padStart(4, "0");
      },
    },
    watch: {
      "form.paket": function () {
        "";
      },
      kataKunci: function () {
        "";
      },
      tracking: {
        deep: true,
        handler: function () {
          localStorage.setItem(KUNCI, JSON.stringify(this.tracking));
        },
      },
    },
    methods: {
      rupiah: function (nilai) {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(nilai);
      },
      namaPaket: function (kode) {
        var item = this.paket.find(function (p) {
          return p.kode === kode;
        });
        return item ? item.nama : kode;
      },
      labelEkspedisi: function (kode) {
        var item = this.pengirimanList.find(function (p) {
          return p.kode === kode;
        });
        return item ? item.nama : kode;
      },
      buatDO: function () {
        this.pesanForm = "";
        if (!/^\d{8,12}$/.test(this.form.nim))
          this.pesanForm = "NIM wajib diisi dengan 8 sampai 12 angka.";
        else if (!this.form.nama)
          this.pesanForm = "Nama mahasiswa wajib diisi.";
        else if (!this.form.ekspedisi)
          this.pesanForm = "Ekspedisi wajib dipilih.";
        else if (!this.paketTerpilih)
          this.pesanForm = "Paket bahan ajar wajib dipilih.";
        else if (
          !/^\d{4}-\d{2}-\d{2}$/.test(this.form.tanggalKirim) ||
          isNaN(new Date(this.form.tanggalKirim).getTime())
        )
          this.pesanForm = "Tanggal kirim tidak valid.";
        if (this.pesanForm) return;
        var nomor = this.nomorDOBerikut;
        this.$set(this.tracking, nomor, {
          nim: this.form.nim,
          nama: this.form.nama,
          status: "DO Dibuat",
          ekspedisi: this.form.ekspedisi,
          tanggalKirim: this.form.tanggalKirim,
          paket: this.paketTerpilih.kode,
          total: this.paketTerpilih.harga,
          perjalanan: [
            {
              waktu: this.form.tanggalKirim + " 08:00:00",
              keterangan: "Delivery Order dibuat (simulasi lokal)",
            },
          ],
        });
        this.kataKunci = nomor;
        this.sukses = "DO " + nomor + " berhasil dibuat.";
        this.form = {
          nim: "",
          nama: "",
          ekspedisi: "",
          paket: "",
          tanggalKirim: tanggalHariIni(),
        };
      },
    },
  });
})();
